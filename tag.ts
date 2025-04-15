import FormData from 'form-data';

import axios from 'axios';
import { fetchDanbooruTags } from './fetchDanbooruTags';
import { type PostTags, type SauceNAOResponse } from './types';
import { Readable } from 'node:stream';

export const queryImage = async (
  stream: Readable
): Promise<PostTags | null> => {
  // Prepare FormData
  const form = new FormData();
  form.append('file', stream, {
    filename: 'image.png',
    contentType: 'image/png',
  });

  // Build query
  const query = new URLSearchParams({
    output_type: '2',
    numres: '1',
    dbmask: '512',
    minsim: '70',
    api_key: process.env.SAUCENAO_API_KEY ?? '',
  });
  const reqUrl = `https://saucenao.com/search.php?${query.toString()}`;

  // Send request
  const response = await axios.post<SauceNAOResponse>(reqUrl, form, {
    headers: form.getHeaders(),
  });

  const results = response.data.results;

  try {
    if (!results?.length) {
      console.warn('SauceNAO returned no results');
      return null;
    }

    const result = results[0];
    const danbooruUrl = result.data.ext_urls?.find((url: string) =>
      url.includes('danbooru.donmai.us')
    );

    if (!danbooruUrl) return null;

    return await fetchDanbooruTags(danbooruUrl);
  } catch (err) {
    console.warn('SauceNAO error:', err);
    return null;
  }
};
