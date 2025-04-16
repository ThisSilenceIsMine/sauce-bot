import type { Message } from 'node-telegram-bot-api';

export const ContentType = {
  DOCUMENT: 'document',
  PHOTO: 'photo',
  DANBOORU: 'danbooru',
} as const;

export type ContentType = (typeof ContentType)[keyof typeof ContentType];

export const getContentType = (msg: Message): ContentType | null => {
  if (msg.document) return ContentType.DOCUMENT;
  if (msg.photo) return ContentType.PHOTO;

  if (msg.text && msg.text.includes('danbooru.donmai.us'))
    return ContentType.DANBOORU;

  return null;
};
