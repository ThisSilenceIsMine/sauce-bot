# tg-tagger

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

## Telegram bot for image auto-tagging with following flow:
1. Send image to running bot
2. Bot finds image on danbooru via SauceNAO API
3. Bot pulls character / artist tags
4. Reposts image into specified channel with formatted tags

## Required env format:
```env
BOT_TOKEN=
TARGET_CHANNEL=
SAUCENAO_API_KEY=
AUTHOR_ID=
```

^ AUTHOR_ID is required for authorization and currently uses single user