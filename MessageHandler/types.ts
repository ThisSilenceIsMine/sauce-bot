import type { Message } from 'node-telegram-bot-api';
import type TelegramBot from 'node-telegram-bot-api';
import type { ContentType } from './getContentType';

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
  tags: string[];
  source?: string;
  artist?: string;
  rating?: string;
}

export interface MessageHandler {
  handle: (msg: Message, bot: TelegramBot) => Promise<PostResult>;
}

export interface ContentHandler {
  type: ContentType;
  handle: (msg: Message, bot: TelegramBot) => Promise<PostResult>;
}
