import { TelegramClient } from "@mtcute/web";
import { Long } from "@mtcute/core";
import {
  DRIVE_SIGNATURE,
  DEFAULT_DRIVE_TITLE,
  LS_DRIVE,
} from "../config/telegram";
import type { DriveConfig } from "../types";

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
 * Scan the user's dialogs looking for a group whose description contains
 * the drive signature hashtag. Returns the config if found, null otherwise.
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

  let cachedConfig: DriveConfig | null = null;
  const cached = localStorage.getItem(userDriveKey) || localStorage.getItem(LS_DRIVE);
  if (cached) {
    try {
      const parsed = JSON.parse(cached) as DriveConfig;
      if (parsed && parsed.chatId) {
        const verified = await verifyDriveGroup(client, parsed);
        if (verified) {
          cachedConfig = verified;
        }
      }
    } catch {
      localStorage.removeItem(userDriveKey);
      localStorage.removeItem(LS_DRIVE);
    }
  }

  const dialogs: any[] = [];
  try {
    for await (const dialog of client.iterDialogs({ limit: 200 })) {
      dialogs.push(dialog);
    }
  } catch (err) {
    console.warn("Failed to fetch main dialogs during radar scan:", err);
  }

  try {
    for await (const dialog of client.iterDialogs({ limit: 100, folder: 1 })) {
      dialogs.push(dialog);
    }
  } catch {
    // folder: 1 might fail if there are no archived dialogs
  }

  const candidates: { config: DriveConfig; bareId: number }[] = [];

  for (const dialog of dialogs) {
    const chat = dialog.chat;
    if (
      !chat ||
      (chat.chatType !== "supergroup" &&
        chat.type !== "supergroup" &&
        chat.type !== "channel" &&
        chat.chatType !== "channel")
    ) {
      continue;
    }

    try {
      let about = "";
      try {
        const full = await client.getFullChat(chat.inputPeer || chat.id);
        about = full.bio || "";
      } catch {
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
      }

      if (about.includes(DRIVE_SIGNATURE)) {
        const markedId = getMarkedChannelId(chat.id);
        const bareId = getBareChannelId(chat.id);
        const accessHashStr = (chat as any).raw?.accessHash
          ? (chat as any).raw.accessHash.toString()
          : chat.accessHash
          ? chat.accessHash.toString()
          : "0";

        const config: DriveConfig = {
          chatId: markedId,
          chatTitle: chat.title,
          accessHash: accessHashStr,
        };

        candidates.push({ config, bareId });
      }
    } catch (err) {
      console.warn("Error checking chat in scanForDriveGroup:", chat.title, err);
      continue;
    }
  }

  if (candidates.length > 0) {
    // Sort candidates by bareId ascending (smallest bare ID = oldest Telegram channel)
    candidates.sort((a, b) => a.bareId - b.bareId);
    const oldestConfig = candidates[0].config;
    localStorage.setItem(userDriveKey, JSON.stringify(oldestConfig));
    return oldestConfig;
  }

  if (cachedConfig) {
    localStorage.setItem(userDriveKey, JSON.stringify(cachedConfig));
    return cachedConfig;
  }

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

