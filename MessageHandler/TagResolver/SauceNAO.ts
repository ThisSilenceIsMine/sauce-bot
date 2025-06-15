import FormData from 'form-data';

import { api } from '../api';
import { Readable } from 'node:stream';
import type { SauceNAOResponse } from '../../types';
import { fetchDanbooruInfo, type DanbooruPostInfo } from './fetchDanbooruInfo';

const MINIMUM_SIMILARITY = 70;

type RateLimitInfo = {
  shortRemaining: number;
  longRemaining: number;
  shortLimit: number;
  longLimit: number;
};

type Return = {
  postInfo: DanbooruPostInfo | null;
  rateLimitInfo: RateLimitInfo;
};

export const queryImage = async (stream: Readable): Promise<Return> => {
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
  console.log('sending request to SauceNAO', reqUrl);
  const response = await api.post<SauceNAOResponse>(reqUrl, form, {
    headers: form.getHeaders(),
  });

  // Log rate limit information
  console.log('SauceNAO Rate Limits:', {
    short: `${response.data.header.short_remaining}/${response.data.header.short_limit}`,
    long: `${response.data.header.long_remaining}/${response.data.header.long_limit}`,
  });

  const results = response.data.results;

  const rateLimitInfo: RateLimitInfo = {
    shortRemaining: response.data.header.short_remaining,
    longRemaining: response.data.header.long_remaining,
    shortLimit: parseInt(response.data.header.short_limit),
    longLimit: parseInt(response.data.header.long_limit),
  };

  try {
    if (!results?.length) {
      console.warn('SauceNAO returned no results');
      return {
        postInfo: null,
        rateLimitInfo,
      };
    }

    const simMatch = results.filter(
      (result) => parseFloat(result.header.similarity) >= MINIMUM_SIMILARITY
    );

    if (!simMatch.length) {
      console.warn(
        `SauceNAO didn't find image with similarity of ${MINIMUM_SIMILARITY} or above`
      );
      return {
        postInfo: null,
        rateLimitInfo,
      };
    }

    const danbooruUrl = simMatch[0].data.ext_urls?.find((url: string) =>
      url.includes('danbooru.donmai.us')
    );

    if (!danbooruUrl) {
      console.warn("SauceNAO didn't find a Danbooru URL");
      return {
        postInfo: null,
        rateLimitInfo,
      };
    }

    const postInfo = await fetchDanbooruInfo(danbooruUrl);

    return {
      postInfo,
      rateLimitInfo,
    };
  } catch (err) {
    console.warn('SauceNAO error:', err);
    return {
      postInfo: null,
      rateLimitInfo,
    };
  }
};
