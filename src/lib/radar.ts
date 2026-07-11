import { TelegramClient, Api } from "telegram";
import {
  DRIVE_SIGNATURE,
  DEFAULT_DRIVE_TITLE,
  LS_DRIVE,
} from "../config/telegram";
import type { DriveConfig } from "../types";
import bigInt from "big-integer";

async function verifyDriveGroup(
  client: TelegramClient,
  config: DriveConfig
): Promise<DriveConfig | null> {
  try {
    const channel = new Api.InputPeerChannel({
      channelId: bigInt(config.chatId),
      accessHash: bigInt(config.accessHash),
    });
    const full = await client.invoke(
      new Api.channels.GetFullChannel({ channel })
    );
    const about = (full.fullChat as Api.ChannelFull).about ?? "";
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
    const mainDialogs = await client.getDialogs({ limit: 200 });
    dialogs.push(...mainDialogs);
  } catch (err) {
    console.warn("Failed to fetch main dialogs during radar scan:", err);
  }

  try {
    // Also scan archived dialogs (folder: 1) in case the user archived the drive group
    const archivedDialogs = await client.getDialogs({ limit: 100, folder: 1 });
    dialogs.push(...archivedDialogs);
  } catch (err) {
    // folder: 1 might fail if there are no archived dialogs, which is fine
  }

  for (const dialog of dialogs) {
    const entity = dialog.entity;
    if (!entity) continue;

    // We only care about channels / supergroups
    if (entity.className !== "Channel") continue;
    const channel = entity as Api.Channel;

    // OPTIMIZATION: Only verify description if the title matches or contains "drive" or "clash"
    // This prevents requesting GetFullChannel details on every channel (which causes FloodWait)
    const titleLower = channel.title.toLowerCase();
    if (!titleLower.includes("drive") && !titleLower.includes("clash")) continue;

    // Pull full info to read the "about" field
    try {
      const full = await client.invoke(
        new Api.channels.GetFullChannel({ channel })
      );
      const about = (full.fullChat as Api.ChannelFull).about ?? "";
      if (about.includes(DRIVE_SIGNATURE)) {
        const config: DriveConfig = {
          chatId: channel.id.toString(),
          chatTitle: channel.title,
          accessHash: channel.accessHash ? channel.accessHash.toString() : "0",
        };
        localStorage.setItem(userDriveKey, JSON.stringify(config));
        return config;
      }
    } catch {
      // Permission errors, skip
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
  const result = await client.invoke(
    new Api.channels.CreateChannel({
      title: DEFAULT_DRIVE_TITLE,
      about: `Personal cloud storage powered by Telegram.\n${DRIVE_SIGNATURE}`,
      megagroup: true,
      forum: true,
    })
  );

  const chats = (result as Api.Updates).chats;
  const channel = chats[0] as Api.Channel;

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
