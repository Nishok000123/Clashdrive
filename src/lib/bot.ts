import { TelegramClient, Api } from "telegram";
import bigInt from "big-integer";
import type { DriveConfig } from "../types";

/**
 * Obfuscated decoding helper to prevent raw bot string exposure in frontend source code.
 */
const _d = (s: string): string => {
  try {
    return atob(s);
  } catch {
    return "";
  }
};

/**
 * Dynamic bot usernames (decoded at runtime)
 * Primary bot: @painxclash_bot ("cGFpbnhjbGFzaF9ib3Q=")
 * Old bots to kick: @clashdrivebot ("Y2xhc2hkcml2ZWJvdA=="), @clashdrive ("Y2xhc2hkcml2ZQ==")
 */
export const BOT_USERNAME = _d("cGFpbnhjbGFzaF9ib3Q=");
export const OLD_BOT_USERNAME = _d("Y2xhc2hkcml2ZWJvdA==");
export const OLD_BOT_ALT = _d("Y2xhc2hkcml2ZQ==");

export const DEFAULT_WORKER_URL = "https://clashdrive.clashgram.workers.dev";

export interface BotAdminStatus {
  success: boolean;
  message: string;
  isAdmin?: boolean;
}

/**
 * Kicks old bot (@clashdrive / @clashdrivebot) if present in the channel,
 * auto-invites the new bot (@painxclash_bot), and promotes it to Admin.
 */
export async function ensureBotIsAdmin(
  client: TelegramClient,
  config: DriveConfig
): Promise<BotAdminStatus> {
  if (!client || !config || !config.chatId) {
    return { success: false, message: "No active Telegram client or drive config." };
  }

  try {
    const channelPeer = new Api.InputPeerChannel({
      channelId: bigInt(config.chatId),
      accessHash: bigInt(config.accessHash || "0"),
    });

    // 1. Kick/remove old bot (@clashdrivebot / @clashdrive) from user's Drive channel
    const oldBotsToKick = [OLD_BOT_USERNAME, OLD_BOT_ALT];
    for (const oldName of oldBotsToKick) {
      if (!oldName) continue;
      try {
        const oldBotUser = await client.getEntity(oldName);
        if (oldBotUser) {
          const kickBannedRights = new Api.ChatBannedRights({
            viewMessages: true,
            sendMessages: true,
            sendMedia: true,
            untilDate: 0,
          });
          await client.invoke(
            new Api.channels.EditBanned({
              channel: channelPeer,
              participant: oldBotUser,
              bannedRights: kickBannedRights,
            })
          );
          console.log(`[bot] Kicked old bot @${oldName} from drive channel.`);
        }
      } catch (kickErr) {
        // Safe to ignore if old bot wasn't found or already removed
        console.debug(`[bot] Old bot @${oldName} check:`, kickErr);
      }
    }

    // 2. Resolve new bot entity (@painxclash_bot)
    let botUser: any = null;
    try {
      botUser = await client.getEntity(BOT_USERNAME);
    } catch {
      try {
        const res = await client.invoke(
          new Api.contacts.Search({ q: BOT_USERNAME, limit: 5 })
        );
        if (res.users && res.users.length > 0) {
          botUser = res.users[0];
        }
      } catch (searchErr) {
        console.warn("[bot] Search for new bot failed:", searchErr);
      }
    }

    if (!botUser) {
      return {
        success: false,
        message: `Could not locate Telegram bot @${BOT_USERNAME}. Please start the bot first.`,
      };
    }

    // 3. Invite new bot to channel
    try {
      await client.invoke(
        new Api.channels.InviteToChannel({
          channel: channelPeer,
          users: [botUser],
        })
      );
    } catch (inviteErr: any) {
      const errStr = String(inviteErr);
      if (!errStr.includes("USER_ALREADY_PARTICIPANT")) {
        console.warn("[bot] Invite bot warning (continuing to promote):", inviteErr);
      }
    }

    // 4. Promote new bot to Admin with full permissions
    const adminRights = new Api.ChatAdminRights({
      changeInfo: true,
      postMessages: true,
      editMessages: true,
      deleteMessages: true,
      banUsers: false,
      inviteUsers: true,
      pinMessages: true,
      addAdmins: false,
      anonymous: false,
      manageCall: false,
      other: true,
      manageTopics: true,
    });

    await client.invoke(
      new Api.channels.EditAdmin({
        channel: channelPeer,
        userId: botUser,
        adminRights,
        rank: "File Sharing Bot",
      })
    );

    return {
      success: true,
      isAdmin: true,
      message: `@${BOT_USERNAME} successfully added and granted admin privileges!`,
    };
  } catch (err: any) {
    console.error("[bot] Failed to setup bot admin:", err);
    return {
      success: false,
      message: err?.message || `Failed to make @${BOT_USERNAME} an admin.`,
    };
  }
}
