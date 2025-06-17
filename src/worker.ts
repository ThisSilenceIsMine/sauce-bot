import { handleMessage } from '../MessageHandler';

export interface Env {
  BOT_TOKEN: string;
  AUTHOR_ID: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
    // Set environment variables for the handlers
    process.env.BOT_TOKEN = env.BOT_TOKEN;
    process.env.AUTHOR_ID = env.AUTHOR_ID;

    const url = new URL(request.url);

    // Handle Telegram webhook
    if (request.method === 'POST' && url.pathname === '/webhook') {
      try {
        const update = await request.json();

        // Handle message updates
        if (update.message) {
          const result = await handleMessage(update.message, {
            sendMessage: async (chatId: number, text: string) => {
              await sendTelegramMessage(chatId, text, env.BOT_TOKEN);
            },
            sendPhoto: async (chatId: number, photo: string, options?: any) => {
              await sendTelegramPhoto(chatId, photo, options, env.BOT_TOKEN);
            },
          } as any);

          return new Response(JSON.stringify({ ok: true }), {
            headers: { 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ ok: true }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Webhook error:', error);
        return new Response(
          JSON.stringify({ error: 'Internal server error' }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Health check endpoint
    if (request.method === 'GET' && url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not Found', { status: 404 });
  },
};

async function sendTelegramMessage(
  chatId: number,
  text: string,
  botToken: string
): Promise<void> {
  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to send message: ${response.statusText}`);
  }
}

async function sendTelegramPhoto(
  chatId: number,
  photo: string,
  options: any,
  botToken: string
): Promise<void> {
  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/sendPhoto`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        photo: photo,
        caption: options?.caption,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to send photo: ${response.statusText}`);
  }
}
