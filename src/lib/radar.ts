import { TelegramClient } from "@mtcute/web";
import { Long } from "@mtcute/core";
import {
  DRIVE_SIGNATURE,
  DEFAULT_DRIVE_TITLE,
  LS_DRIVE,
} from "../config/telegram";
import type { DriveConfig } from "../types";

async function verifyDriveGroup(
  client: TelegramClient,
  config: DriveConfig
): Promise<DriveConfig | null> {
  try {
    const channelInput = {
      _: "inputChannel" as const,
      channelId: Number(config.chatId),
      accessHash: Long.fromString(config.accessHash || "0"),
    };
    const full: any = await client.call({
      _: "channels.getFullChannel",
      channel: channelInput,
    });
    const about = full.fullChat?.about ?? "";
    return about.includes(DRIVE_SIGNATURE) ? config : null;
  } catch {
    return null;
  }
}

/**
 * Scan the user's dialogs looking for a group whose description contains
 * the drive signature hashtag. Returns the config if found, null otherwise.
 */
export async function scanForDriveGroup(
  client: TelegramClient
): Promise<DriveConfig | null> {
  const me = await client.getMe();
  const userId = me ? me.id.toString() : "default";
  const userDriveKey = `${LS_DRIVE}_${userId}`;

  // Check localStorage first
  const cached = localStorage.getItem(userDriveKey);
  if (cached) {
    try {
      const config = JSON.parse(cached) as DriveConfig;
      if (config.accessHash) {
        const verified = await verifyDriveGroup(client, config);
        if (verified) return verified;
        localStorage.removeItem(userDriveKey);
      }
    } catch {
      localStorage.removeItem(userDriveKey);
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
    // Also scan archived dialogs (folder: 1) in case the user archived the drive group
    for await (const dialog of client.iterDialogs({ limit: 100, folder: 1 })) {
      dialogs.push(dialog);
    }
  } catch (err) {
    // folder: 1 might fail if there are no archived dialogs, which is fine
  }

  for (const dialog of dialogs) {
    const chat = dialog.chat;
    if (!chat || (chat.type !== "supergroup" && chat.type !== "channel")) continue;

    const titleLower = (chat.title || "").toLowerCase();
    if (!titleLower.includes("drive") && !titleLower.includes("clash")) continue;

    try {
      const channelInput = {
        _: "inputChannel" as const,
        channelId: chat.id,
        accessHash: chat.accessHash || Long.ZERO,
      };
      const full: any = await client.call({
        _: "channels.getFullChannel",
        channel: channelInput,
      });
      const about = full.fullChat?.about ?? "";
      if (about.includes(DRIVE_SIGNATURE)) {
        const config: DriveConfig = {
          chatId: chat.id.toString(),
          chatTitle: chat.title,
          accessHash: chat.accessHash ? chat.accessHash.toString() : "0",
        };
        localStorage.setItem(userDriveKey, JSON.stringify(config));
        return config;
      }
    } catch {
      continue;
    }
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

  const config: DriveConfig = {
    chatId: channel.id.toString(),
    chatTitle: channel.title,
    accessHash: channel.accessHash ? channel.accessHash.toString() : "0",
  };

  const me = await client.getMe();
  const userId = me ? me.id.toString() : "default";
  const userDriveKey = `${LS_DRIVE}_${userId}`;
  localStorage.setItem(userDriveKey, JSON.stringify(config));

  return config;
}
