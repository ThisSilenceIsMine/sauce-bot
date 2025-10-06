import type { DanbooruPostInfo } from "./fetchDanbooruInfo";

/**
 * Characters that need to be escaped in Telegram's Markdown format:
 * - _ * [ ] ( ) ~ ` > # + - = | { } ! \
 */
const MARKDOWN_SPECIAL_CHARS = /([_*\[\]()~`>#+\-=|{}!\\])/g;

/**
 * Escapes special characters for Telegram's Markdown format
 */
const escapeMarkdown = (text: string): string =>
  text.replace(MARKDOWN_SPECIAL_CHARS, "\\$1");

/**
 * Sanitizes a tag by removing special characters that shouldn't be in tags
 */
const sanitizeTag = (tag: string): string =>
  tag.replace(/[:=]/g, "").replace(/-/g, "_");

/**
 * Formats a list of tags with proper escaping and sanitization
 */
const formatTags = (tags: string[]): string =>
  tags
    .map((tag) => `\#${escapeMarkdown(sanitizeTag(tag))}`)
    .join(" ")
    .trim();

/**
 * Cleans up a URL by removing duplicate slashes while preserving protocol
 */
const cleanUrl = (url: string): string => url.replace(/([^:]\/)\/+/g, "$1");

/**
 * Creates a formatted link to the Danbooru post
 */
const createPostLink = (url: string): string =>
  `[${escapeMarkdown("View on Danbooru")}](${cleanUrl(url)})`;

/**
 * Builds a caption for a Danbooru post with proper formatting
 */
export const buildCaption = (postInfo: DanbooruPostInfo): string => {
  const captionParts = [
    // Character tags
    postInfo?.characters?.length ? formatTags(postInfo.characters) : null,

    // Author tags
    postInfo?.authors?.length ? `by ${formatTags(postInfo.authors)}` : null,

    // Empty line before post link
    postInfo.postUrl ? "" : null,

    // Post link
    postInfo.postUrl ? createPostLink(postInfo.postUrl) : null,
  ]
    .filter((line) => line != null) // Remove null/undefined values
    .join("\n");

  return captionParts;
};
