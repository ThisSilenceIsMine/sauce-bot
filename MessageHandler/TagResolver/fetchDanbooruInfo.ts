import { api } from "../api";
import type { PostInfo } from "../types";
import { PostRating } from "../types";
import { formatTags } from "../utils";
import { type DanbooruAPIPost } from "./types";

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

    // Prefer the original; fall back to the largest sample.
    let imageUrl = [
      data.file_url,
      data.large_file_url,
      ...data.media_asset.variants
        .filter((variant) => variant.type === "original")
        .map((variant) => variant.url),
    ].find((url: string | null) => url);

    if (!imageUrl) {
      console.log("No suitable image URL found");
      return null;
    }

    // Normalise protocol‑relative/relative paths
    if (imageUrl.startsWith("//")) imageUrl = `https:${imageUrl}`;
    if (imageUrl.startsWith("/"))
      imageUrl = `https://danbooru.donmai.us${imageUrl}`;

    // Extract rating with error handling
    let rating: PostRating = PostRating.General; // Default to safe if rating is missing
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
    };
  } catch (err) {
    console.log("Danbooru API error:", err);
    return null;
  }
};
