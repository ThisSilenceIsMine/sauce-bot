import type { Message } from "node-telegram-bot-api";
import type TelegramBot from "node-telegram-bot-api";
import { ContentType } from "../getContentType";
import { buildCaption } from "../TagResolver/buildCaption";
import type { ContentHandler, PostResult } from "../types";
import { sendPostConfirmation, postToChannel, isNSFW } from "../utils";
import { fetchImageStream } from "../TagResolver/fetchImageURL";
import { fetchYandereInfo } from "../TagResolver/Yandere/fetchYandereInfo";

export class YandereHandler implements ContentHandler {
  type = ContentType.YANDERE;

  async handle(msg: Message, bot: TelegramBot): Promise<PostResult> {
    const chatId = msg.chat.id;
    const yandereUrl = msg.text;

    if (!yandereUrl) {
      await bot.sendMessage(chatId, "Send me a link to a yandere post.");
      return { error: "No yandere URL provided" };
    }

    console.log("getting post from", yandereUrl);
    const postInfo = await fetchYandereInfo(yandereUrl);

    console.log("postInfo", postInfo);

    if (!postInfo) {
      await bot.sendMessage(chatId, "Failed to fetch post info");
      return { error: "Failed to fetch post info" };
    }

    console.log("fetching image stream");
    const imageStream = await fetchImageStream(postInfo.imageUrl);

    console.log("imageStream", imageStream);

    if (!imageStream) {
      await bot.sendMessage(chatId, "Failed to create image stream");
      return { error: "Failed to create image stream" };
    }

    console.log("building caption");
    const caption = buildCaption(postInfo);

    console.log("caption", caption);

    // Check if the message has a spoiler flag or if the post has a NSFW rating
    let spoiler = msg.has_media_spoiler || isNSFW(postInfo.rating);

    await postToChannel(bot, imageStream, caption, spoiler);

    await sendPostConfirmation(chatId, bot, caption);

    return { success: true };
  }
}
