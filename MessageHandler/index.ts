import type { Message } from "node-telegram-bot-api";
import type TelegramBot from "node-telegram-bot-api";
import { getContentType } from "./getContentType";
import { PhotoHandler } from "./handlers/PhotoHandler";
import { DanbooruHandler } from "./handlers/DanbooruHandler";
import type { PostResult } from "./types";
import { GelbooruHandler } from "./handlers/GelbooruHandler";
import { YandereHandler } from "./handlers/YandereHandler";

const handlers = [
  new PhotoHandler(),
  new DanbooruHandler(),
  new GelbooruHandler(),
  new YandereHandler(),
];

export const handleMessage = async (
  msg: Message,
  bot: TelegramBot
): Promise<PostResult> => {
  const chatId = msg.chat.id;

  if (String(msg.from?.id) !== process.env.AUTHOR_ID) {
    console.log("Not authorized", msg.from);
    return {
      error: "Not authorized",
    };
  }

  const contentType = getContentType(msg);
  console.log("contentType", contentType);

  if (!contentType) {
    return {
      error: "Send me an image or a link to a danbooru post.",
    };
  }

  const handler = handlers.find((h) => h.type === contentType);

  if (!handler) {
    return {
      error: "Unsupported content type",
    };
  }

  return handler.handle(msg, bot);
};
