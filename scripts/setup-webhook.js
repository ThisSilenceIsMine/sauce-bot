#!/usr/bin/env node

const BOT_TOKEN = process.env.BOT_TOKEN;
const WORKER_URL =
  process.env.WORKER_URL || 'https://tg-tagger.your-subdomain.workers.dev';

if (!BOT_TOKEN) {
  console.error('BOT_TOKEN environment variable is required');
  process.exit(1);
}

async function setupWebhook() {
  try {
    console.log('Setting up webhook...');

    // Set webhook
    const webhookUrl = `${WORKER_URL}/webhook`;
    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: webhookUrl,
          allowed_updates: ['message'],
        }),
      }
    );

    const result = await response.json();

    if (result.ok) {
      console.log('✅ Webhook set successfully!');
      console.log(`Webhook URL: ${webhookUrl}`);
    } else {
      console.error('❌ Failed to set webhook:', result.description);
    }

    // Get webhook info
    const infoResponse = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`
    );
    const info = await infoResponse.json();

    if (info.ok) {
      console.log('\nWebhook Info:');
      console.log(JSON.stringify(info.result, null, 2));
    }
  } catch (error) {
    console.error('Error setting up webhook:', error);
    process.exit(1);
  }
}

setupWebhook();
