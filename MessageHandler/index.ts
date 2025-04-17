import type TelegramBot from 'node-telegram-bot-api';
import type { Message } from 'node-telegram-bot-api';
import { ContentType, getContentType } from './getContentType';
import { queryImage } from './TagResolver/SauceNAO';
import { fetchDanbooruInfo } from './TagResolver/fetchDanbooruInfo';
import { fetchDanbooruImageStream } from './TagResolver/fetchDanbooruImageURL';
import { buildCaption } from './TagResolver/buildCaption';

export const handleMessage = async (msg: Message, bot: TelegramBot) => {
  const chatId = msg.chat.id;

  if (String(msg.from?.id) !== process.env.AUTHOR_ID) {
    console.log('Not authorized', msg.from);

    return {
      error: 'Not authorized',
    };
  }

  const contentType = getContentType(msg);

  console.log('contentType', contentType);

  if (!contentType) {
    return {
      error: 'Send me an image or a link to a danbooru post.',
    };
  }

  if (contentType === ContentType.PHOTO) {
    const fileId = msg.photo?.at(-1)?.file_id;

    if (!fileId) {
      return {
        error: 'Send me an image.',
      };
    }

    const fileStream = bot.getFileStream(fileId);

    console.log(`Got file stream`);

    const tags = await queryImage(fileStream);

    console.log('tags root', tags);

    const spoiler = msg.has_media_spoiler;

    if (!tags) {
      await bot.sendPhoto(process.env.TARGET_CHANNEL!, fileId, {
        has_spoiler: spoiler,
      });

      bot.sendMessage(chatId, `Failed to tag, posted`);

      return;
    }

    const caption = buildCaption(tags);
    // Repost to target channel

    await bot.sendPhoto(process.env.TARGET_CHANNEL!, fileId, {
      caption,
      has_spoiler: spoiler,
      parse_mode: 'Markdown',
    });

    // Let user know it's done
    bot.sendMessage(chatId, `Tagged & posted: ${caption}`, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
    });

    return;
  }

  if (contentType === ContentType.DANBOORU) {
    const danbooruUrl = msg.text;

    if (!danbooruUrl) {
      await bot.sendMessage(chatId, 'Send me a link to a danbooru post.');

      return;
    }

    const postInfo = await fetchDanbooruInfo(danbooruUrl);

    if (!postInfo) {
      await bot.sendMessage(chatId, 'Failed to fetch tags');

      return;
    }

    console.log('postInfo', postInfo);

    const imageStream = await fetchDanbooruImageStream(danbooruUrl);

    if (!imageStream) {
      await bot.sendMessage(chatId, 'Failed to fetch image');

      return;
    }

    const caption = buildCaption(postInfo);

    await bot.sendPhoto(process.env.TARGET_CHANNEL!, imageStream, {
      caption,
      parse_mode: 'Markdown',
    });

    await bot.sendMessage(chatId, `Tagged & posted: ${caption}`, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
    });

    return;
  }
};
