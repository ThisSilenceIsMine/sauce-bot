# Cloudflare Workers Deployment Guide

This guide will help you deploy your Telegram bot to Cloudflare Workers.

## Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Node.js**: Version 16 or higher
3. **Wrangler CLI**: Cloudflare's deployment tool

## Setup Steps

### 1. Install Wrangler CLI

```bash
npm install -g wrangler
```

### 2. Login to Cloudflare

```bash
wrangler login
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Set your secrets using Wrangler:

```bash
# Set your bot token
wrangler secret put BOT_TOKEN

# Set your authorized user ID
wrangler secret put AUTHOR_ID

# Set your SauceNAO API key (if you have one)
wrangler secret put SAUCENAO_API_KEY

# Set your target channel ID (optional)
wrangler secret put TARGET_CHANNEL
```

### 5. Deploy to Cloudflare Workers

```bash
# Deploy to production
npm run deploy

# Or deploy to staging first
npm run deploy:staging
```

### 6. Set Up Telegram Webhook

After deployment, you'll get a URL like `https://tg-tagger.your-subdomain.workers.dev`. Use this to set up the webhook:

```bash
# Set the WORKER_URL environment variable
export WORKER_URL="https://tg-tagger.your-subdomain.workers.dev"

# Run the webhook setup script
npm run setup-webhook
```

Or manually set the webhook:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://tg-tagger.your-subdomain.workers.dev/webhook",
    "allowed_updates": ["message"]
  }'
```

## Development

For local development:

```bash
npm run dev
```

This will start a local development server that you can use to test your bot.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `BOT_TOKEN` | Your Telegram bot token from @BotFather | Yes |
| `AUTHOR_ID` | Your Telegram user ID (for authorization) | Yes |
| `SAUCENAO_API_KEY` | SauceNAO API key for image search | No |
| `TARGET_CHANNEL` | Channel ID where images will be posted | No |

## How It Works

1. **Webhook Mode**: Instead of polling, the bot now uses Telegram's webhook system
2. **Serverless**: Runs on Cloudflare's edge network for global performance
3. **No File System**: Images are processed via URLs instead of local file storage
4. **Stateless**: Each request is handled independently

## Limitations

- **Image Resizing**: The `sharp` library is not available in Cloudflare Workers, so image resizing is disabled
- **File Storage**: No persistent file storage (uses Telegram's file URLs directly)
- **Memory**: Limited to 128MB per request
- **CPU Time**: Limited to 50ms CPU time per request

## Troubleshooting

### Webhook Issues

If the webhook isn't working:

1. Check if the webhook is set correctly:
   ```bash
   curl "https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo"
   ```

2. Verify your bot token is correct
3. Make sure the worker URL is accessible

### Deployment Issues

1. Check Wrangler logs:
   ```bash
   wrangler tail
   ```

2. Verify environment variables are set:
   ```bash
   wrangler secret list
   ```

### Bot Not Responding

1. Check the worker logs in Cloudflare dashboard
2. Verify the webhook URL is correct
3. Test the health endpoint: `https://your-worker.workers.dev/health`

## Monitoring

- **Cloudflare Dashboard**: Monitor requests, errors, and performance
- **Wrangler Tail**: Real-time logs during development
- **Telegram Bot API**: Check webhook delivery status

## Cost

Cloudflare Workers has a generous free tier:
- 100,000 requests per day
- 10GB bandwidth per month
- Perfect for most bot use cases 