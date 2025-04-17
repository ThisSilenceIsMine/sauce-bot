# tg-tagger

To install dependencies:

```bash
bun install
```

To run:

```bash
bun start
```

## Telegram bot for image auto-tagging with following flow:
1. Send image to running bot
2. Bot finds image on danbooru via SauceNAO API
3. Bot pulls character / artist tags
4. Reposts image into specified channel with formatted tags

Bot can also operate on Danbooru posts via direct links, and if this is only intended use case, SauceNAO api key isn't required.

## Required env format:
```env
BOT_TOKEN=
AUTHOR_ID=
TARGET_CHANNEL=

SAUCENAO_API_KEY=
```

^ AUTHOR_ID is Telegram UserID required for authorization (currently only one user)