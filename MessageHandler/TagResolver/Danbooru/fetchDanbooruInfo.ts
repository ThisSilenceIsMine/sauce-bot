import { api } from "../../api";
import type { PostInfo } from "../../types";
import { PostRating } from "../../types";
import { formatTags } from "../../utils";
import { type DanbooruAPIPost } from "./types";

const VIDEO_EXTENSIONS = new Set(["mp4", "webm"]);

const isVideoExtension = (url: string) =>
  VIDEO_EXTENSIONS.has(url.split(".").pop()?.toLowerCase() ?? "");

export const fetchDanbooruInfo = async (
  url: string
): Promise<PostInfo | null> => {
  const match = url.match(/(?:posts|post\/show)\/(\d+)/);
  if (!match) {
    console.log("Invalid Danbooru post URL");
    return null;
  }

  const postId = match[1];
  const apiUrl = `https://danbooru.donmai.us/posts/${postId}.json`;

  try {
    console.log("fetching danbooru info", apiUrl);
    const { data } = await api.get<DanbooruAPIPost>(apiUrl);

    const isVideo =
      VIDEO_EXTENSIONS.has(data.file_ext) || data.media_asset.duration != null;

    let imageUrl: string | undefined;

    if (isVideo) {
      const videoVariant = data.media_asset.variants.find(
        (v) => VIDEO_EXTENSIONS.has(v.file_ext)
      );

      imageUrl = [
        data.large_file_url,
        videoVariant?.url,
        data.file_url,
      ]
        .filter((u): u is string => !!u)
        .find(isVideoExtension);
    }

    if (!imageUrl) {
      imageUrl = [
        data.file_url,
        data.large_file_url,
        ...data.media_asset.variants
          .filter((variant) => variant.type === "original")
          .map((variant) => variant.url),
      ].find((url: string | null) => url) ?? undefined;
    }

    if (!imageUrl) {
      console.log("No suitable media URL found");
      return null;
    }

    if (imageUrl.startsWith("//")) imageUrl = `https:${imageUrl}`;
    if (imageUrl.startsWith("/"))
      imageUrl = `https://danbooru.donmai.us${imageUrl}`;

    let rating: PostRating = PostRating.General;
    try {
      if (data.rating && Object.values(PostRating).includes(data.rating)) {
        rating = data.rating;
      } else {
        console.log(
          `Warning: Missing rating for post ${postId}, defaulting to 's'`
        );
      }
    } catch (error) {
      console.error(`Error extracting rating for post ${postId}:`, error);
    }

    return {
      authors: formatTags(data.tag_string_artist),
      characters: formatTags(data.tag_string_character),
      imageUrl,
      postUrl: `https://danbooru.donmai.us/posts/${postId}`,
      rating,
      isVideo,
    };
  } catch (err) {
    console.log("Danbooru API error:", err);
    return null;
  }
};
