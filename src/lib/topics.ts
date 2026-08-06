import { TelegramClient } from "@mtcute/web";
import type { TopicFolder, DriveConfig } from "../types";

/**
 * List all forum topics in the drive supergroup.
 * Returns them mapped to our TopicFolder shape.
 */
export async function getTopics(
  client: TelegramClient,
  config: DriveConfig
): Promise<TopicFolder[]> {
  try {
    const topics = await client.getForumTopics(Number(config.chatId));
    return topics.map((t) => ({
      id: t.id,
      title: t.title,
      iconColor: t.iconColor ?? 0x6c63ff,
      date: t.date ? Math.floor(t.date.getTime() / 1000) : Math.floor(Date.now() / 1000),
      messageCount: 0,
    }));
  } catch (err) {
    console.error("Failed to load topics:", err);
    return [];
  }
}

/**
 * Create a new topic (folder) inside the drive group.
 */
export async function createTopic(
  client: TelegramClient,
  config: DriveConfig,
  title: string
): Promise<TopicFolder | null> {
  try {
    const msg = await client.createForumTopic({
      chatId: Number(config.chatId),
      title,
    });
    return {
      id: msg.id,
      title,
      iconColor: 0x6c63ff,
      date: Math.floor(Date.now() / 1000),
      messageCount: 0,
    };
  } catch (err) {
    console.error("Failed to create topic:", err);
    return null;
  }
}

export async function renameTopic(
  client: TelegramClient,
  config: DriveConfig,
  topicId: number,
  title: string
): Promise<boolean> {
  try {
    await client.editForumTopic({
      chatId: Number(config.chatId),
      topicId,
      title,
    });
    return true;
  } catch (err) {
    console.error("Failed to rename topic:", err);
    return false;
  }
}

/**
 * Delete a forum topic entirely.
 */
export async function deleteTopic(
  client: TelegramClient,
  config: DriveConfig,
  topicId: number
): Promise<boolean> {
  try {
    await client.deleteForumTopicHistory(Number(config.chatId), topicId);
    return true;
  } catch (err) {
    console.error("Failed to delete topic:", err);
    return false;
  }
}
