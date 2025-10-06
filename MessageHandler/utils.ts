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

export const isNSFW = (rating?: PostRating) =>
  rating
    ? (
        [
          PostRating.Questionable,
          PostRating.Explicit,
          PostRating.Sensitive,
        ] as PostRating[]
      ).includes(rating)
    : false;

export const formatSingleTag = (tag: string) =>
  tag.replace(/[()']/g, "").trim();

export const formatTags = (tags: string) =>
  tags
    .split(" ")
    .map((tag) => formatSingleTag(tag))
    .filter(Boolean);
