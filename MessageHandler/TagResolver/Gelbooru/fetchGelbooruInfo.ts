import api from "axios";
import type { PostInfo, PostRating } from "../../types";
import type { GelbooruAPIPost } from "./types";
import { findTags } from "./findTags";

const BASE_URL = "https://gelbooru.com/index.php";
const GELBOORU_API_KEY = process.env.GELBOORU_API_KEY;
const GELBOORU_UID = process.env.GELBOORU_UID;

const transformPostURLToAPICall = (url: string) => {
  const urlParams = new URLSearchParams(url);
  const postId = urlParams.get("id");
  return `${BASE_URL}?page=dapi&s=post&id=${postId}&q=index&json=1&api_key=${GELBOORU_API_KEY}&user_id=${GELBOORU_UID}`;
};

export const fetchGelbooruInfo = async (
  url: string
): Promise<PostInfo | null> => {
  const apiUrl = transformPostURLToAPICall(url);

  const post = (await api
    .get(apiUrl)
    .then((res) => res.data.post[0])) as GelbooruAPIPost;

  const tags = await findTags(post.tags.split(" "));

  const postInfo = {
    authors: tags?.artistTags || [],
    characters: tags?.characterTags || [],
    imageUrl: post.file_url,
    postUrl: url,
    rating: post.rating as PostRating,
  };

  return postInfo;
};
