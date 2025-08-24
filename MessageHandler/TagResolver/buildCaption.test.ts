import { describe, it, expect } from 'bun:test';
import { buildCaption } from './buildCaption';
import type { DanbooruPostInfo } from './fetchDanbooruInfo';
import { PostRating } from './types';

describe('buildCaption', () => {
  describe('tag sanitization', () => {
    it('should sanitize tags with special characters', () => {
      const postInfo: DanbooruPostInfo = {
        authors: ['artist-name', 'artist_with_underscores', 'artist:with:colons'],
        characters: ['character-name', 'character (parentheses)', 'character/with/slashes'],
        imageUrl: 'https://example.com/image.jpg',
        postUrl: 'https://danbooru.donmai.us/posts/123',
        rating: PostRating.General,
      };

      const caption = buildCaption(postInfo);

      // Check that special characters are replaced with underscores
      expect(caption).toContain('#character_name');
      expect(caption).toContain('#character_parentheses');
      expect(caption).toContain('#character_with_slashes');
      expect(caption).toContain('#artist_name');
      expect(caption).toContain('#artist_with_underscores');
      expect(caption).toContain('#artist_with_colons');
    });

    it('should handle tags with multiple consecutive special characters', () => {
      const postInfo: DanbooruPostInfo = {
        authors: ['artist---name', 'artist___name'],
        characters: ['character...name', 'character   name'],
        imageUrl: 'https://example.com/image.jpg',
        postUrl: 'https://danbooru.donmai.us/posts/123',
        rating: PostRating.General,
      };

      const caption = buildCaption(postInfo);

      // Should collapse consecutive underscores into single underscore
      expect(caption).toContain('#artist_name');
      expect(caption).toContain('#character_name');
    });

    it('should remove leading and trailing underscores', () => {
      const postInfo: DanbooruPostInfo = {
        authors: ['_artist_', '--artist--'],
        characters: ['___character___', '...character...'],
        imageUrl: 'https://example.com/image.jpg',
        postUrl: 'https://danbooru.donmai.us/posts/123',
        rating: PostRating.General,
      };

      const caption = buildCaption(postInfo);

      expect(caption).toContain('#artist');
      expect(caption).toContain('#character');
    });

    it('should handle tags with only special characters by replacing with unknown', () => {
      const postInfo: DanbooruPostInfo = {
        authors: ['---', '!!!', '???'],
        characters: ['***', '+++'],
        imageUrl: 'https://example.com/image.jpg',
        postUrl: 'https://danbooru.donmai.us/posts/123',
        rating: PostRating.General,
      };

      const caption = buildCaption(postInfo);

      // Should not contain #unknown tags as they are filtered out
      expect(caption).not.toContain('#unknown');
      // Should still have the "by" prefix even if no valid author tags
      expect(caption).toContain('by');
    });

    it('should preserve alphanumeric characters and underscores', () => {
      const postInfo: DanbooruPostInfo = {
        authors: ['artist123', 'artist_name_2'],
        characters: ['character1', 'character_test_123'],
        imageUrl: 'https://example.com/image.jpg',
        postUrl: 'https://danbooru.donmai.us/posts/123',
        rating: PostRating.General,
      };

      const caption = buildCaption(postInfo);

      expect(caption).toContain('#artist123');
      expect(caption).toContain('#artist_name_2');
      expect(caption).toContain('#character1');
      expect(caption).toContain('#character_test_123');
    });
  });

  describe('caption structure', () => {
    it('should format caption with characters, authors, and post link', () => {
      const postInfo: DanbooruPostInfo = {
        authors: ['artist1', 'artist2'],
        characters: ['char1', 'char2'],
        imageUrl: 'https://example.com/image.jpg',
        postUrl: 'https://danbooru.donmai.us/posts/123',
        rating: PostRating.General,
      };

      const caption = buildCaption(postInfo);
      const lines = caption.split('\n');

      expect(lines[0]).toContain('#char1 #char2');
      expect(lines[1]).toContain('by #artist1 #artist2');
      expect(lines[2]).toBe(''); // Empty line
      expect(lines[3]).toContain('[View on Danbooru](https://danbooru.donmai.us/posts/123)');
    });

    it('should handle missing characters', () => {
      const postInfo: DanbooruPostInfo = {
        authors: ['artist1'],
        characters: [],
        imageUrl: 'https://example.com/image.jpg',
        postUrl: 'https://danbooru.donmai.us/posts/123',
        rating: PostRating.General,
      };

      const caption = buildCaption(postInfo);

      expect(caption).not.toContain('#char');
      expect(caption).toContain('by #artist1');
      expect(caption).toContain('[View on Danbooru]');
    });

    it('should handle missing authors', () => {
      const postInfo: DanbooruPostInfo = {
        authors: [],
        characters: ['char1'],
        imageUrl: 'https://example.com/image.jpg',
        postUrl: 'https://danbooru.donmai.us/posts/123',
        rating: PostRating.General,
      };

      const caption = buildCaption(postInfo);

      expect(caption).toContain('#char1');
      expect(caption).not.toContain('by #');
      expect(caption).toContain('[View on Danbooru]');
    });

    it('should handle missing post URL', () => {
      const postInfo: DanbooruPostInfo = {
        authors: ['artist1'],
        characters: ['char1'],
        imageUrl: 'https://example.com/image.jpg',
        postUrl: '',
        rating: PostRating.General,
      };

      const caption = buildCaption(postInfo);

      expect(caption).toContain('#char1');
      expect(caption).toContain('by #artist1');
      expect(caption).not.toContain('[View on Danbooru]');
      expect(caption).not.toContain('\n\n'); // No empty line without URL
    });

    it('should handle completely empty post info', () => {
      const postInfo: DanbooruPostInfo = {
        authors: [],
        characters: [],
        imageUrl: 'https://example.com/image.jpg',
        postUrl: '',
        rating: PostRating.General,
      };

      const caption = buildCaption(postInfo);

      expect(caption).toBe('');
    });
  });

  describe('URL handling', () => {
    it('should clean URLs with duplicate slashes', () => {
      const postInfo: DanbooruPostInfo = {
        authors: ['artist1'],
        characters: ['char1'],
        imageUrl: 'https://example.com/image.jpg',
        postUrl: 'https://danbooru.donmai.us//posts//123',
        rating: PostRating.General,
      };

      const caption = buildCaption(postInfo);

      expect(caption).toContain('(https://danbooru.donmai.us/posts/123)');
    });

    it('should preserve protocol in URLs', () => {
      const postInfo: DanbooruPostInfo = {
        authors: ['artist1'],
        characters: ['char1'],
        imageUrl: 'https://example.com/image.jpg',
        postUrl: 'https://danbooru.donmai.us/posts/123',
        rating: PostRating.General,
      };

      const caption = buildCaption(postInfo);

      expect(caption).toContain('(https://danbooru.donmai.us/posts/123)');
    });
  });

  describe('edge cases', () => {
    it('should handle undefined arrays gracefully', () => {
      const postInfo: DanbooruPostInfo = {
        authors: undefined as any,
        characters: undefined as any,
        imageUrl: 'https://example.com/image.jpg',
        postUrl: 'https://danbooru.donmai.us/posts/123',
        rating: PostRating.General,
      };

      const caption = buildCaption(postInfo);

      expect(caption).toContain('[View on Danbooru]');
      expect(caption).not.toContain('#');
    });

    it('should handle null values in arrays', () => {
      const postInfo: DanbooruPostInfo = {
        authors: [null as any, 'artist1', undefined as any],
        characters: ['char1', null as any],
        imageUrl: 'https://example.com/image.jpg',
        postUrl: 'https://danbooru.donmai.us/posts/123',
        rating: PostRating.General,
      };

      const caption = buildCaption(postInfo);

      expect(caption).toContain('#char1');
      expect(caption).toContain('by #artist1');
    });

    it('should handle very long tag names', () => {
      const longTag = 'a'.repeat(100);
      const postInfo: DanbooruPostInfo = {
        authors: [longTag],
        characters: [longTag],
        imageUrl: 'https://example.com/image.jpg',
        postUrl: 'https://danbooru.donmai.us/posts/123',
        rating: PostRating.General,
      };

      const caption = buildCaption(postInfo);

      expect(caption).toContain(`#${longTag}`);
    });
  });
});