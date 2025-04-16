import FormData from 'form-data';

import axios from 'axios';
import { Readable } from 'node:stream';
import type { SauceNAOResponse } from '../../types';
import { fetchDanbooruInfo, type DanbooruPostInfo } from './fetchDanbooruInfo';

const MINIMUM_SIMILARITY = 70;

export const queryImage = async (
  stream: Readable
): Promise<DanbooruPostInfo | null> => {
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
    minsim: MINIMUM_SIMILARITY.toString(),
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

    const simMatch = results.filter(
      (result) => parseFloat(result.header.similarity) >= MINIMUM_SIMILARITY
    );

    if (!simMatch.length) {
      console.warn(
        `SauceNAO didn't find image with similarity of ${MINIMUM_SIMILARITY} or above`
      );
      return null;
    }

    const danbooruUrl = simMatch[0].data.ext_urls?.find((url: string) =>
      url.includes('danbooru.donmai.us')
    );

    if (!danbooruUrl) return null;

    return await fetchDanbooruInfo(danbooruUrl);
  } catch (err) {
    console.warn('SauceNAO error:', err);
    return null;
  }
};
