import fs from 'fs';
import path from 'path';
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { queryImage } from './tag';

dotenv.config();

const bot = new TelegramBot(process.env.BOT_TOKEN!, { polling: true });

const downloadDir = path.resolve('./downloads');
if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir);

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;

  if (String(msg.from?.id) !== process.env.AUTHOR_ID) {
    console.log('Not authorized', msg.from);
    bot.sendMessage(chatId, 'You are not authorized to use this bot.');

    return;
  }

  const fileId = msg.photo?.at(-1)?.file_id;

  if (!fileId) {
    bot.sendMessage(chatId, 'Send me an image as a document.');
    return;
  }

  try {
    const fileStream = bot.getFileStream(fileId);

    console.log(`Got file stream`);

    // Call DanTagGen
    const tags = await queryImage(fileStream);

    console.log('tags root', tags);

    if (!tags) {
      await bot.sendPhoto(process.env.TARGET_CHANNEL!, fileId);

      bot.sendMessage(chatId, `Failed to tag, still posted`);

      return;
    }

    const captionLines = [];

    if (tags?.characters?.length) {
      captionLines.push(tags.characters.map((c) => `#${c}`).join(' '));
    }

    if (tags?.authors?.length) {
      captionLines.push(`by ${tags.authors.map((a) => `#${a}`).join(' ')}`);
    }

    const caption = captionLines.join('\n');
    // Repost to target channel

    await bot.sendPhoto(process.env.TARGET_CHANNEL!, fileId, { caption });

    // Let user know it’s done
    bot.sendMessage(chatId, `Tagged & posted: ${caption}`);
  } catch (err) {
    console.error(err);
    bot.sendMessage(
      chatId,
      `Error: ${err instanceof Error ? err.message : 'Unknown error'}`
    );
  }
});
