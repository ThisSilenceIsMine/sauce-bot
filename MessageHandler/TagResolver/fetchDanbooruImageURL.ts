import axios from 'axios';
import { Readable } from 'stream';

/**
 * Grab the high‑res image URL (original if possible, otherwise "large" sample)
 * from a Danbooru post link.
 */
export const fetchDanbooruImageStream = async (
  url: string
): Promise<Readable | null> => {
  const match = url.match(/(?:posts|post\/show)\/(\d+)/);
  if (!match) {
    console.log('Invalid Danbooru post URL');
    return null;
  }

  const postId = match[1];
  const apiUrl = `https://danbooru.donmai.us/posts/${postId}.json`;

  try {
    const { data } = await axios.get(apiUrl);

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

    // Fetch the image as a stream
    const response = await axios.get(imgUrl, { responseType: 'stream' });
    const stream = response.data as Readable;

    return stream;
  } catch (err) {
    console.log('Danbooru API error', err);
    return null;
  }
};
