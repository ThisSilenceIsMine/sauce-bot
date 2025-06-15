import { api } from '../api';

export interface DanbooruPostInfo {
  authors: string[];
  characters: string[];
  /** Highest‑res image URL available (original if possible) */
  imageUrl: string;
  /** The URL of the post on Danbooru */
  postUrl: string;
}

const formatTag = (tags: string) =>
  tags
    .split(' ')
    .map((tag) => tag.replace(/[()']/g, '').trim())
    .filter(Boolean);

export const fetchDanbooruInfo = async (
  url: string
): Promise<DanbooruPostInfo | null> => {
  const match = url.match(/(?:posts|post\/show)\/(\d+)/);
  if (!match) {
    console.log('Invalid Danbooru post URL');
    return null;
  }

  const postId = match[1];
  const apiUrl = `https://danbooru.donmai.us/posts/${postId}.json`;

  try {
    const { data } = await api.get(apiUrl);

    // Prefer the original; fall back to the largest sample.
    let imageUrl = [data.file_url, data.large_file_url].find(
      (url: string | null) => url && url.endsWith('.jpg')
    );
    // let imageUrl: string = data.file_url || data.large_file_url;
    if (!imageUrl) {
      console.log('No suitable image URL found');
      return null;
    }

    // Normalise protocol‑relative/relative paths
    if (imageUrl.startsWith('//')) imageUrl = `https:${imageUrl}`;
    if (imageUrl.startsWith('/'))
      imageUrl = `https://danbooru.donmai.us${imageUrl}`;

    return {
      authors: formatTag(data.tag_string_artist),
      characters: formatTag(data.tag_string_character),
      imageUrl,
      postUrl: `https://danbooru.donmai.us/posts/${postId}`,
    };
  } catch (err) {
    console.log('Danbooru API error:', err);
    return null;
  }
};
