import { api } from '../api';

/**
 * Grab the high‑res image URL (original if possible, otherwise "large" sample)
 * from a Danbooru post link.
 */
export const fetchDanbooruImageURL = async (
  url: string
): Promise<string | null> => {
  const match = url.match(/(?:posts|post\/show)\/(\d+)/);
  if (!match) {
    console.log('Invalid Danbooru post URL');
    return null;
  }

  const postId = match[1];
  const apiUrl = `https://danbooru.donmai.us/posts/${postId}.json`;

  try {
    console.log('fetching danbooru image URL', apiUrl);
    const { data } = await api.get(apiUrl);

    console.log('url-fetch data', data);

    // Prefer original; fall back to the biggest sample Danbooru gives us.
    let imgUrl: string | undefined = data.file_url || data.large_file_url;

    if (!imgUrl) {
      console.log('No high-res URL found');
      return null;
    }

    // Danbooru sometimes returns protocol‑relative ("//") or site‑relative ("/") paths.
    if (imgUrl.startsWith('//')) imgUrl = `https:${imgUrl}`;
    if (imgUrl.startsWith('/')) imgUrl = `https://danbooru.donmai.us${imgUrl}`;

    console.log('returning image URL', imgUrl);
    return imgUrl;
  } catch (err) {
    console.log('Danbooru API error');
    return null;
  }
};

// Keep the old function for backward compatibility but mark as deprecated
export const fetchDanbooruImageStream = async (
  url: string
): Promise<any | null> => {
  console.warn(
    'fetchDanbooruImageStream is deprecated, use fetchDanbooruImageURL instead'
  );
  const imageUrl = await fetchDanbooruImageURL(url);
  return imageUrl ? { url: imageUrl } : null;
};
