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

The bot also accepts direct Danbooru post links; if you stick to links only, the SauceNAO API key is optional.

## Required env format:
```env
BOT_TOKEN=
AUTHOR_ID=
TARGET_CHANNEL=

SAUCENAO_API_KEY=
```

`AUTHOR_ID` is the Telegram user ID allowed to use the bot (only one user for now).


## Deployment

Suggested deployment option is Docker since most hosting services can't run `bun` out of the box at all (and I CBA switching to node).