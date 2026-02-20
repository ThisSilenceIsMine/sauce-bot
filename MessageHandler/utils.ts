import type TelegramBot from "node-telegram-bot-api";
import { Readable } from "stream";
import { PostRating } from "./types";

export const sendRateLimitInfo = async (
  chatId: number,
  bot: TelegramBot,
  rateLimitInfo: {
    shortRemaining: number;
    shortLimit: number;
    longRemaining: number;
    longLimit: number;
  }
) => {
  await bot.sendMessage(
    chatId,
    [
      "Rate limits (remaining/limit):",
      `Short (30s): ${rateLimitInfo.shortRemaining}/${rateLimitInfo.shortLimit}`,
      `Long (24h): ${rateLimitInfo.longRemaining}/${rateLimitInfo.longLimit}`,
    ].join("\n")
  );
};

export const sendPostConfirmation = async (
  chatId: number,
  bot: TelegramBot,
  caption: string
) => {
  await bot.sendMessage(chatId, `Tagged & posted: ${caption}`, {
    parse_mode: "Markdown",
    disable_web_page_preview: true,
  });
};

export const postToChannel = async (
  bot: TelegramBot,
  fileIdOrStream: string | Readable | Buffer,
  caption: string,
  hasSpoiler?: boolean
) => {
  await bot.sendPhoto(process.env.TARGET_CHANNEL!, fileIdOrStream, {
    caption,
    has_spoiler: hasSpoiler,
    parse_mode: "Markdown",
  });
};

export const postVideoToChannel = async (
  bot: TelegramBot,
  video: Buffer,
  caption: string,
  hasSpoiler?: boolean
) => {
  await bot.sendVideo(process.env.TARGET_CHANNEL!, video, {
    caption,
    has_spoiler: hasSpoiler,
    parse_mode: "Markdown",
    supports_streaming: true,
  });
};

export const isNSFW = (rating?: PostRating) =>
  rating
    ? ([PostRating.Questionable, PostRating.Explicit] as PostRating[]).includes(
        rating
      )
    : false;

/**
 * Checks if censorship is enabled
 * Censorship is disabled when DISABLE_CENSOR env var is set to a truthy value
 */
export const isCensorshipEnabled = (): boolean => {
  return !process.env.DISABLE_CENSOR;
};

/**
 * Determines if content should be marked as spoiler
 * Respects manual spoiler flags and NSFW rating (if censorship is enabled)
 */
export const shouldMarkAsSpoiler = (
  hasMediaSpoiler: boolean | undefined,
  rating?: PostRating
): boolean => {
  // Always respect manual spoiler flag
  if (hasMediaSpoiler) {
    return true;
  }
  // Only apply NSFW spoiler if censorship is enabled
  if (isCensorshipEnabled() && isNSFW(rating)) {
    return true;
  }
  return false;
};

export const formatSingleTag = (tag: string) =>
  tag.replace(/[()']/g, "").trim();

export const formatTags = (tags: string) =>
  tags
    .split(" ")
    .map((tag) => formatSingleTag(tag))
    .filter(Boolean);
