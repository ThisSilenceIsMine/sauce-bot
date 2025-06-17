import fs from 'fs';
import path from 'path';
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { handleMessage } from './MessageHandler';

dotenv.config();

const bot = new TelegramBot(process.env.BOT_TOKEN!, { polling: true });

const downloadDir = path.resolve('./downloads');
if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir);

// HTTP Server for health checks
const server = Bun.serve({
  port: process.env.PORT || 3000,
  fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === '/health') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          bot: {
            isRunning: bot.isPolling(),
          },
        }),
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    return new Response('Not Found', { status: 404 });
  },
});

console.log(`HTTP server running on port ${server.port}`);

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;

  if (String(msg.from?.id) !== process.env.AUTHOR_ID) {
    console.log('Not authorized', msg.from);
    bot.sendMessage(chatId, 'You are not authorized to use this bot.');

    return;
  }

  try {
    await handleMessage(msg, bot);
  } catch (err) {
    console.error(err);
    bot.sendMessage(
      chatId,
      `Error: ${err instanceof Error ? err.message : 'Unknown error'}`
    );
  }
});

console.log('Telegram bot started');
