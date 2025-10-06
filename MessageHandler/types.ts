import type { Message } from "node-telegram-bot-api";
import type TelegramBot from "node-telegram-bot-api";
import type { ContentType } from "./getContentType";
export const PostRating = {
  General: "g",
  Sensitive: "s",
  Questionable: "q",
  Explicit: "e",
} as const;

export type PostRating = (typeof PostRating)[keyof typeof PostRating];

export interface PostResult {
  error?: string;
  success?: boolean;
}

export interface RateLimitInfo {
  shortRemaining: number;
  shortLimit: number;
  longRemaining: number;
  longLimit: number;
}

export interface PostInfo {
  authors: string[];
  characters: string[];
  /** Highest‑res image URL available (original if possible) */
  imageUrl: string;
  /** The URL of the post on Danbooru */
  postUrl: string;
  /** Rating of the post */
  rating: PostRating;
}

export interface MessageHandler {
  handle: (msg: Message, bot: TelegramBot) => Promise<PostResult>;
}

export interface ContentHandler {
  type: ContentType;
  handle: (msg: Message, bot: TelegramBot) => Promise<PostResult>;
}
