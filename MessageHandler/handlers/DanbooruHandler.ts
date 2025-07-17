import type { Message } from 'node-telegram-bot-api';
import type TelegramBot from 'node-telegram-bot-api';
import { ContentType } from '../getContentType';
import { fetchDanbooruInfo, isNSFW } from '../TagResolver/fetchDanbooruInfo';
import { fetchDanbooruImageStream } from '../TagResolver/fetchDanbooruImageURL';
import { buildCaption } from '../TagResolver/buildCaption';
import type { ContentHandler, PostResult } from '../types';
import { sendPostConfirmation, postToChannel } from '../utils';

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

    const imageStream = await fetchDanbooruImageStream(danbooruUrl);

    if (!imageStream) {
      await bot.sendMessage(chatId, 'Failed to fetch image');
      return { error: 'Failed to fetch image' };
    }

    const caption = buildCaption(postInfo);

    // Check if the message has a spoiler flag or if the post has a NSFW rating
    let spoiler = msg.has_media_spoiler || isNSFW(postInfo.rating);

    await postToChannel(bot, imageStream, caption, spoiler);

    await sendPostConfirmation(chatId, bot, caption);

    return { success: true };
  }
}
