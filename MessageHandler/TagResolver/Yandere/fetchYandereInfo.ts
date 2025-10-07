import { api } from "../../api";
import type { PostInfo } from "../../types";
import { PostRating } from "../../types";
import { formatSingleTag } from "../../utils";
import { TagType, type Response } from "./types";

const BASE_URL = "https://yande.re";

export const fetchYandereInfo = async (
  url: string
): Promise<PostInfo | null> => {
  const match = url.match(/\/post\/show\/(\d+)/);
  if (!match) {
    console.log("Invalid Yandere post URL");
    return null;
  }

  const postId = match[1];

  try {
    const { data, status, request } = await api.get<Response>(
      `${BASE_URL}/post.json`,
      {
        params: {
          api_version: 2,
          tags: `id:${postId}`,
          filter: "1",
          include_tags: "1",
        },
      }
    );

    if (!data) {
      console.log("No post found for ID:", postId);
      return null;
    }

    const post = data.posts[0];

    const tagsInfo = data.tags;

    const authors = Object.keys(tagsInfo)
      .filter((tag) => tagsInfo[tag] === TagType.ARTIST)
      .map((tag) => formatSingleTag(tag));
    const characters = Object.keys(tagsInfo)
      .filter((tag) => tagsInfo[tag] === TagType.CHARACTER)
      .map((tag) => formatSingleTag(tag));

    const postInfo: PostInfo = {
      postUrl: `https://yande.re/post/show/${postId}`,
      imageUrl: post.file_url,
      rating: post.rating as PostRating,
      authors: authors,
      characters: characters,
    };

    return postInfo;
  } catch (err) {
    console.log("Yandere API error:", err);
    return null;
  }
};
