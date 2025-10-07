import type { Message } from "node-telegram-bot-api";

export const ContentType = {
  DOCUMENT: "document",
  PHOTO: "photo",
  DANBOORU: "danbooru",
  GELBOORU: "gelbooru",
  YANDERE: "yandere",
} as const;

export type ContentType = (typeof ContentType)[keyof typeof ContentType];

export const getContentType = (msg: Message): ContentType | null => {
  if (msg.document) return ContentType.DOCUMENT;
  if (msg.photo) return ContentType.PHOTO;

  if (msg.text && msg.text.includes("danbooru.donmai.us"))
    return ContentType.DANBOORU;

  if (msg.text && msg.text.includes("gelbooru.com"))
    return ContentType.GELBOORU;

  if (msg.text && msg.text.includes("yande.re")) return ContentType.YANDERE;

  return null;
};
