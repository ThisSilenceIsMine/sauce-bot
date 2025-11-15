# tg-tagger

A Telegram bot for automatically tagging and reposting images to channels. The bot can identify images using SauceNAO reverse image search, or accept direct links from supported image boards (Danbooru, Gelbooru, Yandere).

## Features

- **Image Auto-Tagging**: Send images directly to the bot, and it will find them on image boards via SauceNAO API
- **Direct Link Support**: Accept direct links from Danbooru, Gelbooru, and Yandere image boards
- **Automatic Tag Extraction**: Pulls character, artist, and other metadata tags from image boards
- **Formatted Captions**: Creates nicely formatted captions with tags for reposting
- **NSFW Detection**: Automatically marks NSFW content as spoilers (can be disabled via environment variable)
- **Multiple Image Sources**: Supports Danbooru, Gelbooru, and Yandere

## Prerequisites

- [Bun](https://bun.sh/) runtime (latest version)
- A Telegram bot token
- A Telegram channel where images will be posted
- (Optional) SauceNAO API key for reverse image search
- (Optional) Gelbooru API credentials for Gelbooru link support

## Quick Start

### Installation

```bash
bun install
```

### Configuration

Create a `.env` file in the project root with the following variables:

```env
# Required
BOT_TOKEN=your_telegram_bot_token
AUTHOR_ID=your_telegram_user_id
TARGET_CHANNEL=your_channel_id
USER_AGENT=TG-TAGGER/1.0

# Optional - for reverse image search
SAUCENAO_API_KEY=your_saucenao_api_key

# Optional - for Gelbooru link support
GELBOORU_API_KEY=your_gelbooru_api_key
GELBOORU_UID=your_gelbooru_user_id

# Optional - disable automatic NSFW spoiler marking
DISABLE_CENSOR=false
```

### Running Locally

```bash
bun start
```

The bot will start polling for messages and an HTTP server will run on port 8080 (or the port specified in `PORT` env variable) for health checks.

## Getting Required Credentials

### Telegram Bot Token

1. Open Telegram and search for [@BotFather](https://t.me/BotFather)
2. Send `/newbot` and follow the instructions
3. Copy the bot token provided by BotFather
4. Add your bot to your target channel as an administrator with permission to post messages

### Telegram User ID (AUTHOR_ID)

1. Search for [@userinfobot](https://t.me/userinfobot) on Telegram
2. Start a conversation with the bot
3. It will reply with your user ID - copy this number

### Target Channel
Use the channel ID (e.g., `-1001234567890`)
To get the channel ID, forward a message from the channel to [@userinfobot](https://t.me/userinfobot)

### SauceNAO API Key (Optional)

1. Go to [SauceNAO API](https://saucenao.com/user.php)
2. Create an account or log in
3. Navigate to the API section
4. Copy your API key
5. **Note**: If you only plan to use direct links (Danbooru, Gelbooru, Yandere), you don't need this

### Gelbooru API Credentials (Optional)

1. Go to [Gelbooru](https://gelbooru.com/)
2. Create an account and log in
3. Navigate to your account settings/API section
4. Copy your API key and user ID
5. **Note**: Only needed if you want to use Gelbooru links

## Usage

### Sending Images

Simply send an image directly to the bot. The bot will:
1. Use SauceNAO to find the image on image boards
2. Extract tags and metadata
3. Post the image to your target channel with formatted tags

**Note**: If the image is not found via SauceNAO, it will still be posted but without tags.

### Sending Direct Links

You can send direct links to supported image boards:

- **Danbooru**: `https://danbooru.donmai.us/posts/5397570`
- **Gelbooru**: `https://gelbooru.com/index.php?page=post&s=view&id=7316878`
- **Yandere**: `https://yande.re/post/show/1166324`

The bot will:
1. Fetch the post information from the image board
2. Extract tags and metadata
3. Download and repost the image to your target channel with formatted tags

### NSFW Content

- Images with NSFW ratings are automatically marked as spoilers (unless censorship is disabled)
- You can also manually mark images as spoilers when sending them to the bot
- The bot respects both manual spoiler flags and automatic NSFW detection
- To disable automatic NSFW spoiler marking, set `DISABLE_CENSOR=true` in your environment variables

## Supported Content Types

The bot supports the following content types:

1. **Photos**: Images sent as photos in Telegram
2. **Danbooru Links**: Direct links to Danbooru posts
3. **Gelbooru Links**: Direct links to Gelbooru posts (requires API credentials)
4. **Yandere Links**: Direct links to Yandere posts

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BOT_TOKEN` | Yes | Your Telegram bot token from BotFather |
| `AUTHOR_ID` | Yes | Your Telegram user ID (only this user can use the bot) |
| `TARGET_CHANNEL` | Yes | Channel username (e.g., `@channel`) or channel ID (e.g., `-1001234567890`) |
| `SAUCENAO_API_KEY` | No | SauceNAO API key for reverse image search (required for image tagging) |
| `USER_AGENT` | No | User agent string for API requests (default: `TG-TAGGER/1.0`) |
| `GELBOORU_API_KEY` | No | Gelbooru API key (required for Gelbooru link support) |
| `GELBOORU_UID` | No | Gelbooru user ID (required for Gelbooru link support) |
| `PORT` | No | Port for health check HTTP server (default: `8080`) |
| `DISABLE_CENSOR` | No | Set to `true` to disable automatic NSFW spoiler marking (manual spoiler flags still work) |

## Deployment

### Health Check

The bot includes a health check endpoint at `/health` that returns:
- Bot status
- Uptime
- Timestamp

Access it at `http://localhost:8080/health` (or your configured port).