# Use official Bun image
FROM oven/bun:latest

# Create app dir
WORKDIR /app

# Copy everything
COPY . .

# Install deps
RUN bun install --frozen-lockfile

# Use .env if present (Docker Compose will mount it)
ENV NODE_ENV=production

# Run the bot
CMD ["bun", "index.ts"]
