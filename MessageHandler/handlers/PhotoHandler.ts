import type { Message } from "node-telegram-bot-api";
import type TelegramBot from "node-telegram-bot-api";
import { ContentType } from "../getContentType";
import { queryImage } from "../TagResolver/IQDB";
import { buildCaption } from "../TagResolver/buildCaption";
import type { ContentHandler, PostResult } from "../types";
import {
  sendPostConfirmation,
  postToChannel,
  shouldMarkAsSpoiler,
} from "../utils";

export class PhotoHandler implements ContentHandler {
  type = ContentType.PHOTO;

  async handle(msg: Message, bot: TelegramBot): Promise<PostResult> {
    const chatId = msg.chat.id;
    const fileId = msg.photo?.at(-1)?.file_id;

    if (!fileId) {
      return {
        error: "Send me an image.",
      };
    }

    const fileStream = bot.getFileStream(fileId);
    console.log(`Got file stream`);

    const postInfo = await queryImage(fileStream);
    console.log("postInfo", postInfo);

    const spoiler = shouldMarkAsSpoiler(
      msg.has_media_spoiler,
      postInfo?.rating
    );

    if (!postInfo) {
      await postToChannel(bot, fileId, "", spoiler);
      await bot.sendMessage(chatId, `Failed to tag, posted untagged`);
      return { success: true };
    }

    const caption = buildCaption(postInfo);
    await postToChannel(bot, fileId, caption, spoiler);
    await sendPostConfirmation(chatId, bot, caption);

    return { success: true };
  }
}
