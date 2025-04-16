import type { DanbooruPostInfo } from './fetchDanbooruInfo';

const escapeMarkdownV2 = (text: string): string =>
  text.replace(/([_*\[\]()~`>#+\-=|{}!\\])/g, '\\$1'); // escape all MarkdownV2 symbols

export const buildCaption = (postInfo: DanbooruPostInfo) => {
  const captionLines: string[] = [];

  if (postInfo?.characters?.length) {
    captionLines.push(
      postInfo.characters.map((c) => `\#${escapeMarkdownV2(c)}`).join(' ')
    );
  }

  if (postInfo?.authors?.length) {
    captionLines.push(
      `by ${postInfo.authors.map((a) => `\#${escapeMarkdownV2(a)}`).join(' ')}`
    );
  }

  if (postInfo.postUrl) {
    captionLines.push('');
    captionLines.push(
      `[${escapeMarkdownV2(
        'View on Danbooru'
      )}](https://danbooru.donmai.us//posts//9161330)`
    );
  }

  return captionLines.join('\n');
};
