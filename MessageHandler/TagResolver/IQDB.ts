import { searchPic, type IQDBSearchResultItem } from "iqdb-client";
import type { Readable } from "node:stream";

import { fetchDanbooruInfo } from "./Danbooru/fetchDanbooruInfo";
import type { PostInfo } from "../types";

const MINIMUM_SIMILARITY = 0.7;

export const queryImage = async (
  stream: Readable
): Promise<PostInfo | null> => {
  try {
    console.log("Sending request to IQDB");
    const result = await searchPic(stream, { lib: "www" });

    if (!result.ok) {
      const errMsg = "err" in result ? result.err : "unknown";
      console.warn("IQDB search failed:", errMsg);
      return null;
    }

    const match = result.data
      .filter((item: IQDBSearchResultItem) => item.head !== "Your image" && item.sourceUrl)
      .find((item: IQDBSearchResultItem) => {
        const similarity = item.similarity ?? 0;
        return (
          similarity >= MINIMUM_SIMILARITY &&
          item.sourceUrl?.includes("danbooru")
        );
      });

    if (!match?.sourceUrl) {
      console.warn("IQDB didn't find a Danbooru match");
      return null;
    }

    let danbooruUrl = match.sourceUrl;
    if (danbooruUrl.startsWith("//")) {
      danbooruUrl = `https:${danbooruUrl}`;
    }

    console.log("IQDB found Danbooru URL:", danbooruUrl, "similarity:", match.similarity);
    return await fetchDanbooruInfo(danbooruUrl);
  } catch (err) {
    console.warn("IQDB error:", err);
    return null;
  }
};
