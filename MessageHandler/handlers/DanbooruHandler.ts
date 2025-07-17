import type { Message } from 'node-telegram-bot-api';
import type TelegramBot from 'node-telegram-bot-api';
import { ContentType } from '../getContentType';
import { fetchDanbooruInfo } from '../TagResolver/fetchDanbooruInfo';
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
    let spoiler = msg.has_media_spoiler;

    try {
      // Apply spoiler formatting for NSFW content (rating 'q' or 'e')
      if (postInfo.rating) {
        // If the post is already marked as spoiler by the user, keep it that way
        // Otherwise, apply spoiler based on rating
        if (!spoiler) {
          spoiler = postInfo.rating === 'q' || postInfo.rating === 'e';
        }
      } else {
        // Log missing rating information
        console.log(
          'Warning: Missing rating information for post',
          postInfo.postUrl
        );
      }
    } catch (error) {
      // Log error in rating detection
      console.error('Error detecting rating:', error);
      // Default to non-spoiler formatting if rating detection fails
      // (unless the user explicitly marked it as a spoiler)
    }

    // Use the postToChannel utility for consistency with PhotoHandler
    await postToChannel(bot, imageStream, caption, spoiler);

    await sendPostConfirmation(chatId, bot, caption);

    return { success: true };
  }
}
