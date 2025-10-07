import type { Message } from "node-telegram-bot-api";
import type TelegramBot from "node-telegram-bot-api";
import { ContentType } from "../getContentType";
import { fetchGelbooruInfo } from "../TagResolver/Gelbooru/fetchGelbooruInfo";
import { buildCaption } from "../TagResolver/buildCaption";
import type { ContentHandler, PostResult } from "../types";
import { sendPostConfirmation, postToChannel, isNSFW } from "../utils";
import { fetchImageStream } from "../TagResolver/Danbooru/fetchDanbooruImageURL";

export class GelbooruHandler implements ContentHandler {
  type = ContentType.GELBOORU;

  async handle(msg: Message, bot: TelegramBot): Promise<PostResult> {
    const chatId = msg.chat.id;
    const gelbooruUrl = msg.text;

    if (!gelbooruUrl) {
      await bot.sendMessage(chatId, "Send me a link to a danbooru post.");
      return { error: "No danbooru URL provided" };
    }

    console.log("getting post from", gelbooruUrl);
    const postInfo = await fetchGelbooruInfo(gelbooruUrl);

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
