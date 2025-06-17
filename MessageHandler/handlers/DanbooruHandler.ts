import type { Message } from 'node-telegram-bot-api';
import type TelegramBot from 'node-telegram-bot-api';
import { ContentType } from '../getContentType';
import { fetchDanbooruInfo } from '../TagResolver/fetchDanbooruInfo';
import { fetchDanbooruImageURL } from '../TagResolver/fetchDanbooruImageURL';
import { buildCaption } from '../TagResolver/buildCaption';
import type { ContentHandler, PostResult } from '../types';
import { sendPostConfirmation } from '../utils';

export class DanbooruHandler implements ContentHandler {
  type = ContentType.DANBOORU;

  async handle(msg: Message, bot: TelegramBot): Promise<PostResult> {
    const chatId = msg.chat.id;
    const danbooruUrl = msg.text;

    if (!danbooruUrl) {
      await bot.sendMessage(chatId, 'Send me a link to a danbooru post.');
      return { error: 'No danbooru URL provided' };
    }

    const postInfo = await fetchDanbooruInfo(danbooruUrl);

    if (!postInfo) {
      await bot.sendMessage(chatId, 'Failed to fetch tags');
      return { error: 'Failed to fetch tags' };
    }

    console.log('postInfo', postInfo);

    const imageUrl = await fetchDanbooruImageURL(danbooruUrl);

    if (!imageUrl) {
      await bot.sendMessage(chatId, 'Failed to fetch image');
      return { error: 'Failed to fetch image' };
    }

    const caption = buildCaption(postInfo);

    await bot.sendPhoto(process.env.TARGET_CHANNEL!, imageUrl, {
      caption,
      parse_mode: 'Markdown',
    });

    await sendPostConfirmation(chatId, bot, caption);

    return { success: true };
  }
}
