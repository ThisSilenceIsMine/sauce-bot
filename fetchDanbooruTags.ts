import axios from 'axios';
import type { PostTags } from './types';
const formatTag = (tags: string) =>
  tags.split(' ').map((tag) =>
    tag
      .replace(/[()']/g, '') // remove (, ), and '
      .trim()
  );

export const fetchDanbooruTags = async (
  url: string
): Promise<PostTags | null> => {
  const match = url.match(/(?:posts|post\/show)\/(\d+)/);
  if (!match) {
    console.log('Invalid Danbooru post URL');
    return null;
  }

  const postId = match[1];
  const apiUrl = `https://danbooru.donmai.us/posts/${postId}.json`;

  const res = await axios.get(apiUrl);
  if (!res.data) {
    console.log(`Danbooru API error: ${res.statusText}`);
    return null;
  }
  const data = res.data;
  // Filter to top general + character tags
  const tags = [
    ...formatTag(data.tag_string_character),
    ...formatTag(data.tag_string_artist),
  ];

  console.log('tags', tags);

  return {
    authors: formatTag(data.tag_string_artist),
    characters: formatTag(data.tag_string_character),
  }; // first 5 for now
};
