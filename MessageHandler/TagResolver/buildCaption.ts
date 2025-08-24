import type { DanbooruPostInfo } from './fetchDanbooruInfo';

/**
 * Sanitizes a tag to only contain letters, numbers, and underscores (Telegram hashtag requirement)
 * Replaces spaces and other invalid characters with underscores
 */
const sanitizeTag = (tag: string): string => {
  if (!tag || typeof tag !== 'string') {
    return 'unknown';
  }
  
  return tag
    // Replace spaces and common separators with underscores
    .replace(/[\s\-+.,:;/\\|]/g, '_')
    // Remove all characters that aren't letters, numbers, or underscores
    .replace(/[^a-zA-Z0-9_]/g, '')
    // Remove consecutive underscores
    .replace(/_+/g, '_')
    // Remove leading/trailing underscores
    .replace(/^_+|_+$/g, '')
    // Ensure the tag isn't empty
    || 'unknown';
};

/**
 * Formats a list of tags with proper sanitization for Telegram hashtags
 */
const formatTags = (tags: string[]): string =>
  tags
    .map((tag) => `#${sanitizeTag(tag)}`)
    .filter((tag) => tag !== '#unknown') // Filter out empty/invalid tags
    .join(' ')
    .trim();

/**
 * Cleans up a URL by removing duplicate slashes while preserving protocol
 */
const cleanUrl = (url: string): string => url.replace(/([^:]\/)\/+/g, '$1');

/**
 * Creates a formatted link to the Danbooru post
 */
const createPostLink = (url: string): string =>
  `[View on Danbooru](${cleanUrl(url)})`;

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
    postInfo.postUrl ? '' : null,

    // Post link
    postInfo.postUrl ? createPostLink(postInfo.postUrl) : null,
  ]
    .filter((line) => line != null) // Remove null/undefined values
    .join('\n');

  return captionParts;
};
