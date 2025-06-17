import type { Message } from 'node-telegram-bot-api';
import type TelegramBot from 'node-telegram-bot-api';
import { ContentType } from '../getContentType';
import { queryImageFromUrl } from '../TagResolver/SauceNAO';
import { buildCaption } from '../TagResolver/buildCaption';
import type { ContentHandler, PostResult } from '../types';
import {
  sendRateLimitInfo,
  sendPostConfirmation,
  postToChannel,
} from '../utils';

export class PhotoHandler implements ContentHandler {
  type = ContentType.PHOTO;

  async handle(msg: Message, bot: TelegramBot): Promise<PostResult> {
    const chatId = msg.chat.id;
    const fileId = msg.photo?.at(-1)?.file_id;

    if (!fileId) {
      return {
        error: 'Send me an image.',
      };
    }

    // Get file URL from Telegram
    const fileUrl = `https://api.telegram.org/bot${process.env.BOT_TOKEN}/getFile?file_id=${fileId}`;
    const fileResponse = await fetch(fileUrl);
    const fileData = await fileResponse.json();

    if (!fileData.ok || !fileData.result?.file_path) {
      return {
        error: 'Failed to get file information.',
      };
    }

    const telegramFileUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${fileData.result.file_path}`;
    console.log(`Got file URL: ${telegramFileUrl}`);

    const { postInfo, rateLimitInfo } = await queryImageFromUrl(
      telegramFileUrl
    );
    console.log('postInfo', postInfo);
    console.log('rateLimitInfo', rateLimitInfo);

    const spoiler = msg.has_media_spoiler;

    if (!postInfo) {
      await postToChannel(bot, fileId, '', spoiler);
      await bot.sendMessage(chatId, `Failed to tag, posted untagged`);
      return { success: true };
    }

    const caption = buildCaption(postInfo);
    await postToChannel(bot, fileId, caption, spoiler);
    await sendPostConfirmation(chatId, bot, caption);
    await sendRateLimitInfo(chatId, bot, rateLimitInfo);

    return { success: true };
  }
}
