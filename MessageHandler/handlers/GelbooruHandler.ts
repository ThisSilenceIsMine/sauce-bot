import type { Message } from "node-telegram-bot-api";
import type TelegramBot from "node-telegram-bot-api";
import { ContentType } from "../getContentType";
import { fetchGelbooruInfo } from "../TagResolver/Gelbooru/fetchGelbooruInfo";
import { buildCaption } from "../TagResolver/buildCaption";
import type { ContentHandler, PostResult } from "../types";
import { sendPostConfirmation, postToChannel, isNSFW } from "../utils";
import { fetchImageStream } from "../TagResolver/fetchDanbooruImageURL";

export class GelbooruHandler implements ContentHandler {
  type = ContentType.DANBOORU;

  async handle(msg: Message, bot: TelegramBot): Promise<PostResult> {
    const chatId = msg.chat.id;
    const danbooruUrl = msg.text;

    if (!danbooruUrl) {
      await bot.sendMessage(chatId, "Send me a link to a danbooru post.");
      return { error: "No danbooru URL provided" };
    }

    const postInfo = await fetchGelbooruInfo(danbooruUrl);

    if (!postInfo) {
      await bot.sendMessage(chatId, "Failed to fetch post info");
      return { error: "Failed to fetch post info" };
    }

    const imageStream = await fetchImageStream(postInfo.imageUrl);

    if (!imageStream) {
      await bot.sendMessage(chatId, "Failed to create image stream");
      return { error: "Failed to create image stream" };
    }

    const caption = buildCaption(postInfo);

    // Check if the message has a spoiler flag or if the post has a NSFW rating
    let spoiler = msg.has_media_spoiler || isNSFW(postInfo.rating);

    await postToChannel(bot, imageStream, caption, spoiler);

    await sendPostConfirmation(chatId, bot, caption);

    return { success: true };
  }
}
