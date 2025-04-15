import fetch from 'node-fetch';

export const fetchDanbooruTags = async (url: string): Promise<string[]> => {
  const match = url.match(/posts\/(\d+)/);
  if (!match) throw new Error('Invalid Danbooru post URL');

  const postId = match[1];
  const apiUrl = `https://danbooru.donmai.us/posts/${postId}.json`;

  const res = await fetch(apiUrl);
  if (!res.ok) throw new Error(`Danbooru API error: ${res.statusText}`);

  const data = (await res.json()) as any;

  // Filter to top general + character tags
  const tags = [
    ...data.tag_string_character.split(' '),
    ...data.tag_string_general.split(' '),
  ];
  return tags.slice(0, 5); // first 5 for now
};
