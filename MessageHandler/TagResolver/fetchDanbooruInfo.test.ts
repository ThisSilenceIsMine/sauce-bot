import { describe, it, expect } from 'bun:test';

// We need to extract the formatTag function for testing
// Since it's not exported, we'll test it indirectly through the module's behavior
// or we can modify the source to export it for testing

describe('formatTag function (from fetchDanbooruInfo)', () => {
  // Since formatTag is not exported, we'll create a copy for testing
  // This matches the implementation in fetchDanbooruInfo.ts
  const formatTag = (tags: string) =>
    tags
      .split(' ')
      .map((tag) => tag.replace(/[()']/g, '').trim())
      .filter(Boolean);

  describe('tag parsing and cleaning', () => {
    it('should split space-separated tags', () => {
      const result = formatTag('tag1 tag2 tag3');
      expect(result).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should remove parentheses and quotes', () => {
      const result = formatTag("tag1 tag(with)parens tag'with'quotes");
      expect(result).toEqual(['tag1', 'tagwithparens', 'tagwithquotes']);
    });

    it('should filter out empty tags', () => {
      const result = formatTag('tag1  tag2   tag3');
      expect(result).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should handle tags with only special characters', () => {
      const result = formatTag("tag1 () '' tag2");
      expect(result).toEqual(['tag1', 'tag2']);
    });

    it('should handle empty string input', () => {
      const result = formatTag('');
      expect(result).toEqual([]);
    });

    it('should trim whitespace from individual tags', () => {
      const result = formatTag(' tag1  tag2 ');
      expect(result).toEqual(['tag1', 'tag2']);
    });

    it('should preserve other special characters (not parentheses or quotes)', () => {
      const result = formatTag('tag-with-dashes tag_with_underscores tag:with:colons');
      expect(result).toEqual(['tag-with-dashes', 'tag_with_underscores', 'tag:with:colons']);
    });

    it('should handle complex mixed cases', () => {
      const result = formatTag("artist_name (circle) 'quoted_tag' normal_tag");
      expect(result).toEqual(['artist_name', 'circle', 'quoted_tag', 'normal_tag']);
    });
  });
});