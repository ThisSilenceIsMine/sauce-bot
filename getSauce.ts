import fetch from 'node-fetch';
import FormData from 'form-data';

import fs from 'node:fs/promises';

import sharp from 'sharp';
import { fetchDanbooruTags } from './fetchDanbooruTags';

export const getSauceNAO = async (imagePath: string) => {
  // const imageBuffer = await sharp(imagePath)
  //   .resize({ width: 512, withoutEnlargement: true }) // like `thumbnail`
  //   .png()
  //   .toBuffer();

  const imageBuffer = await fs.readFile(imagePath);

  const form = new FormData();
  form.append('file', imageBuffer, {
    filename: 'image.jpg',
    contentType: 'image/jpeg',
  });

  const query = new URLSearchParams({
    output_type: '2',
    numres: '1',
    dbmask: '512',
    minsim: '70',
    api_key: process.env.SAUCENAO_API_KEY!,
  });

  const reqUrl = `https://saucenao.com/search.php?${query.toString()}`;

  console.log('fetching sauce at', { reqUrl });

  const res = await fetch(reqUrl, {
    method: 'POST',
    body: form,
    headers: form.getHeaders(),
  });

  const text = await res.text();

  let data;
  try {
    try {
      data = JSON.parse(text);
    } catch {
      console.warn('Non-JSON response from SauceNAO');
      return ['notag'];
    }

    console.log({ data });

    if (!data?.results?.length) {
      console.warn('SauceNAO returned no results');
      return ['notag'];
    }

    const result = data.results[0];
    const danbooruUrl = result.data.ext_urls?.find((url: string) =>
      url.includes('danbooru.donmai.us/posts/')
    );
    if (!danbooruUrl) return ['notag'];

    return await fetchDanbooruTags(danbooruUrl);
  } catch (err) {
    console.warn('SauceNAO error:', err);
    return ['notag'];
  }
};
