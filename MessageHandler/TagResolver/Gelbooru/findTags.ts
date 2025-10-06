import api from "axios";
import type { PostInfo } from "../../types";
import type { GelbooruAPIPost, Tag } from "./types";

const BASE_URL = "https://gelbooru.com/index.php";
const GELBOORU_API_KEY = process.env.GELBOORU_API_KEY;
const GELBOORU_UID = process.env.GELBOORU_UID;

const transformTagsToAPICall = (tags: string[]) => {
  return `${BASE_URL}?page=dapi&s=tag&q=index&names=${tags.join(
    " "
  )}&json=1&api_key=${GELBOORU_API_KEY}&user_id=${GELBOORU_UID}`;
};

const ARTIST_TAG_TYPE = 1;
const CHARACTER_TAG_TYPE = 4;

type TagResponse = {
  artistTags: string[];
  characterTags: string[];
};

export const findTags = async (tags: string[]): Promise<TagResponse | null> => {
  const apiUrl = transformTagsToAPICall(tags);
  const response = await api.get(apiUrl);
  const data = response.data;

  const rawTags = data.tag as Tag[];

  return {
    artistTags: rawTags
      .filter((tag) => tag.type === ARTIST_TAG_TYPE)
      .map((tag) => tag.name),
    characterTags: rawTags
      .filter((tag) => tag.type === CHARACTER_TAG_TYPE)
      .map((tag) => tag.name),
  };
};
