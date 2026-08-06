import { TelegramClient } from "@mtcute/web";
import { Long } from "@mtcute/core";
import {
  DRIVE_SIGNATURE,
  DEFAULT_DRIVE_TITLE,
  LS_DRIVE,
} from "../config/telegram";
import type { DriveConfig } from "../types";
import { parseManifest } from "./manifest";

function getBareChannelId(idInput: string | number): number {
  const idStr = String(idInput);
  return Number(idStr.replace(/^-100/, "").replace(/^-/, ""));
}

function getMarkedChannelId(idInput: string | number): string {
  const bare = getBareChannelId(idInput);
  return `-100${bare}`;
}

async function verifyDriveGroup(
  client: TelegramClient,
  config: DriveConfig
): Promise<DriveConfig | null> {
  if (!config || !config.chatId) return null;
  const markedIdStr = getMarkedChannelId(config.chatId);
  const markedIdNum = Number(markedIdStr);

  try {
    const fullChat = await client.getFullChat(markedIdNum);
    if (fullChat && fullChat.bio && fullChat.bio.includes(DRIVE_SIGNATURE)) {
      return { ...config, chatId: markedIdStr };
    }
  } catch {
    // Fall back to direct raw call
  }

  try {
    const bareId = getBareChannelId(config.chatId);
    const channelInput = {
      _: "inputChannel" as const,
      channelId: bareId,
      accessHash: Long.fromString(config.accessHash || "0"),
    };
    const full: any = await client.call({
      _: "channels.getFullChannel",
      channel: channelInput,
    });
    const about = full.fullChat?.about ?? "";
    if (about.includes(DRIVE_SIGNATURE)) {
      return { ...config, chatId: markedIdStr };
    }
  } catch (err) {
    console.warn("verifyDriveGroup failed:", err);
  }

  return null;
}

/**
 * Scan the user's dialogs looking for an existing drive group.
 *
 * Strategy (designed to minimize API calls and avoid FLOOD_WAIT):
 * 1. Check localStorage cache first and verify it.
 * 2. Fetch all dialogs (no extra API calls — just the dialog list).
 * 3. Filter candidates by TITLE only (zero API calls).
 * 4. For the small set of title-matched candidates, check description and message history.
 * 5. Score and return the best candidate.
 */
export async function scanForDriveGroup(
  client: TelegramClient
): Promise<DriveConfig | null> {
  let userId = "default";
  try {
    const me = await client.getMe();
    if (me) userId = me.id.toString();
  } catch (e) {
    console.warn("Failed to fetch user in radar scan:", e);
  }
  const userDriveKey = `${LS_DRIVE}_${userId}`;

  // --- Step 1: Try cached config ---
  const cached = localStorage.getItem(userDriveKey) || localStorage.getItem(LS_DRIVE);
  if (cached) {
    try {
      const parsed = JSON.parse(cached) as DriveConfig;
      if (parsed && parsed.chatId) {
        const verified = await verifyDriveGroup(client, parsed);
        if (verified) {
          localStorage.setItem(userDriveKey, JSON.stringify(verified));
          return verified;
        }
      }
    } catch {
      localStorage.removeItem(userDriveKey);
      localStorage.removeItem(LS_DRIVE);
    }
  }

  // --- Step 2: Fetch all dialogs (single paginated request, no getFullChat calls) ---
  const dialogs: any[] = [];
  try {
    for await (const dialog of client.iterDialogs({ limit: 500 })) {
      dialogs.push(dialog);
    }
  } catch (err) {
    console.warn("Failed to fetch main dialogs during radar scan:", err);
  }
  try {
    for await (const dialog of client.iterDialogs({ limit: 200, folder: 1 })) {
      dialogs.push(dialog);
    }
  } catch {
    // archived folder might fail
  }

  // --- Step 3: Filter by TITLE only (zero API calls) ---
  const TITLE_KEYWORDS = ["drive", "clash", "cloud", "storage", "vault", "tg cloud"];
  const titleCandidates: any[] = [];

  for (const dialog of dialogs) {
    const chat = dialog.chat;
    if (!chat) continue;

    // Skip private 1-on-1 user chats
    if (
      chat.chatType === "user" ||
      chat.type === "user" ||
      (chat as any)._ === "user" ||
      (chat as any)._ === "peerUser"
    ) {
      continue;
    }

    const titleLower = (chat.title || "").toLowerCase();
    if (TITLE_KEYWORDS.some((kw) => titleLower.includes(kw))) {
      titleCandidates.push(chat);
    }
  }

  console.log(`[radar] Found ${titleCandidates.length} title-matched candidates out of ${dialogs.length} dialogs`);

  // --- Step 4: For each title candidate, check description + message history ---
  const scored: {
    config: DriveConfig;
    bareId: number;
    hasSignature: boolean;
    manifestCount: number;
  }[] = [];

  for (const chat of titleCandidates) {
    try {
      // 4a. Check description for signature
      let about = "";
      try {
        const full = await client.getFullChat(chat);
        about = full.bio || "";
      } catch {
        try {
          const bareId = getBareChannelId(chat.id);
          const accessHash = (chat as any).raw?.accessHash || chat.accessHash || Long.ZERO;
          const channelInput = {
            _: "inputChannel" as const,
            channelId: bareId,
            accessHash:
              typeof accessHash === "string"
                ? Long.fromString(accessHash)
                : typeof accessHash === "number"
                ? Long.fromNumber(accessHash)
                : accessHash || Long.ZERO,
          };
          const full: any = await client.call({
            _: "channels.getFullChannel",
            channel: channelInput,
          });
          about = full.fullChat?.about ?? "";
        } catch {
          // can't get description, continue anyway — we'll check messages
        }
      }

      const hasSignature = about.includes(DRIVE_SIGNATURE);

      // 4b. Check message history for segmented_file manifests
      let manifestCount = 0;

      // Check forum topics
      try {
        const markedIdNum = Number(getMarkedChannelId(chat.id));
        const bareId = getBareChannelId(chat.id);
        const accessHash = (chat as any).raw?.accessHash || chat.accessHash || Long.ZERO;
        const peerInput = {
          _: "inputPeerChannel" as const,
          channelId: bareId,
          accessHash:
            typeof accessHash === "string"
              ? Long.fromString(accessHash)
              : typeof accessHash === "number"
              ? Long.fromNumber(accessHash)
              : accessHash || Long.ZERO,
        };

        const topics = await client.getForumTopics(markedIdNum).catch(() => []);
        for (const topic of topics) {
          if (manifestCount > 0) break; // found manifests, no need to check more topics
          try {
            const repliesRes: any = await client.call({
              _: "messages.getReplies",
              peer: peerInput,
              msgId: topic.id,
              offsetId: 0,
              offsetDate: 0,
              addOffset: 0,
              limit: 10,
              maxId: 0,
              minId: 0,
              hash: Long.ZERO,
            });
            for (const m of (repliesRes.messages ?? [])) {
              const text = typeof m.message === "string" ? m.message : typeof m.text === "string" ? m.text : "";
              if (text && (text.includes('"segmented_file"') || parseManifest(text) !== null)) {
                manifestCount++;
              }
            }
          } catch {
            // topic check failed
          }
        }
      } catch {
        // forum topics check failed
      }

      // Check general history
      if (manifestCount === 0) {
        try {
          const history = await client.getHistory(chat, { limit: 30 });
          for (const msg of history) {
            if (msg && msg.text && (msg.text.includes('"segmented_file"') || parseManifest(msg.text) !== null)) {
              manifestCount++;
            }
          }
        } catch {
          // history check failed
        }
      }

      // Only add if we found something meaningful
      if (hasSignature || manifestCount > 0) {
        const markedId = getMarkedChannelId(chat.id);
        const bareId = getBareChannelId(chat.id);
        const accessHashStr = (chat as any).raw?.accessHash
          ? (chat as any).raw.accessHash.toString()
          : chat.accessHash
          ? chat.accessHash.toString()
          : "0";

        const config: DriveConfig = {
          chatId: markedId,
          chatTitle: chat.title || "Clash Drive",
          accessHash: accessHashStr,
        };

        scored.push({ config, bareId, hasSignature, manifestCount });
        console.log(`[radar] Candidate: "${chat.title}" sig=${hasSignature} manifests=${manifestCount} bareId=${bareId}`);
      }
    } catch (err) {
      console.warn("[radar] Error checking candidate:", chat.title, err);
      continue;
    }
  }

  if (scored.length > 0) {
    scored.sort((a, b) => {
      if (b.manifestCount !== a.manifestCount) return b.manifestCount - a.manifestCount;
      if (b.hasSignature !== a.hasSignature) return (b.hasSignature ? 1 : 0) - (a.hasSignature ? 1 : 0);
      return a.bareId - b.bareId;
    });

    const best = scored[0].config;
    console.log(`[radar] Selected drive: "${best.chatTitle}" (${best.chatId})`);
    localStorage.setItem(userDriveKey, JSON.stringify(best));
    return best;
  }

  console.warn("[radar] No drive group found among", titleCandidates.length, "candidates");
  return null;
}

/**
 * Create a new drive supergroup with forum topics enabled.
 */
export async function createDriveGroup(
  client: TelegramClient
): Promise<DriveConfig> {
  const result: any = await client.call({
    _: "channels.createChannel",
    title: DEFAULT_DRIVE_TITLE,
    about: `Personal cloud storage powered by Telegram.\n${DRIVE_SIGNATURE}`,
    megagroup: true,
    forum: true,
  });

  const chats = result.chats || [];
  const channel = chats[0];

  const markedId = getMarkedChannelId(channel.id);
  const config: DriveConfig = {
    chatId: markedId,
    chatTitle: channel.title,
    accessHash: channel.accessHash ? channel.accessHash.toString() : "0",
  };

  let userId = "default";
  try {
    const me = await client.getMe();
    if (me) userId = me.id.toString();
  } catch (e) {
    console.warn("Failed to fetch user in createDriveGroup:", e);
  }
  const userDriveKey = `${LS_DRIVE}_${userId}`;
  localStorage.setItem(userDriveKey, JSON.stringify(config));

  return config;
}

