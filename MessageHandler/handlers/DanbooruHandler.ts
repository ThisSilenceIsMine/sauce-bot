import type { Message } from "node-telegram-bot-api";
import type TelegramBot from "node-telegram-bot-api";
import { ContentType } from "../getContentType";
import { fetchDanbooruInfo } from "../TagResolver/Danbooru/fetchDanbooruInfo";
import { fetchImageStream } from "../TagResolver/fetchImageURL";
import { buildCaption } from "../TagResolver/buildCaption";
import type { ContentHandler, PostResult } from "../types";
import {
  sendPostConfirmation,
  postToChannel,
  postVideoToChannel,
  shouldMarkAsSpoiler,
} from "../utils";

export class DanbooruHandler implements ContentHandler {
  type = ContentType.DANBOORU;

  async handle(msg: Message, bot: TelegramBot): Promise<PostResult> {
    const chatId = msg.chat.id;
    const danbooruUrl = msg.text;

    if (!danbooruUrl) {
      await bot.sendMessage(chatId, "Send me a link to a danbooru post.");
      return { error: "No danbooru URL provided" };
    }

    const postInfo = await fetchDanbooruInfo(danbooruUrl);

    if (!postInfo) {
      await bot.sendMessage(chatId, "Failed to fetch post info");
      return { error: "Failed to fetch post info" };
    }

    console.log("postInfo", postInfo);

    const caption = buildCaption(postInfo);
    const spoiler = shouldMarkAsSpoiler(msg.has_media_spoiler, postInfo.rating);

    console.log("Danbooru caption, postInfo", caption, postInfo);

    if (postInfo.isVideo) {
      await postVideoToChannel(bot, postInfo.imageUrl, caption, spoiler);
    } else {
      const imageStream = await fetchImageStream(postInfo.imageUrl);

      if (!imageStream) {
        await bot.sendMessage(chatId, "Failed to create image stream");
        return { error: "Failed to create image stream" };
      }

      await postToChannel(bot, imageStream, caption, spoiler);
    }

    await sendPostConfirmation(chatId, bot, caption);

    return { success: true };
  }
}
