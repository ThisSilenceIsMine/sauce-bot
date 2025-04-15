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

  if (!msg.document) {
    bot.sendMessage(chatId, 'Send me an image as a document.');
    return;
  }

  try {
    const fileId = msg.document.file_id;
    const fileName = msg.document.file_name || `${Date.now()}.jpg`;

    const filePath = await bot.downloadFile(fileId, downloadDir);
    const fullPath = path.resolve(filePath);
    console.log(`Saved file: ${fullPath}`);

    // Call DanTagGen
    const tags = (await queryImage(fullPath)) as string[];

    // Trim down to 3–5 tags
    const topTags = tags
      .slice(0, 5)
      .map((tag) => `#${tag.replace(/\s+/g, '_')}`);
    const caption = topTags.join(' ');

    // Repost to target channel
    // await bot.sendDocument(process.env.TARGET_CHANNEL!, fullPath, { caption });

    // Let user know it’s done
    bot.sendMessage(chatId, `Tagged & posted: ${caption}`);

    // Optional: clean up
    await fs.unlink(fullPath, (err) => {
      if (err) console.error(err);
    });
  } catch (err) {
    console.error(err);
    bot.sendMessage(
      chatId,
      `Error: ${err instanceof Error ? err.message : 'Unknown error'}`
    );
  }
});
