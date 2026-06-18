import { api } from "../api";
import { Readable } from "stream";
import { resizeImageToTelegramLimit } from "./resizeImage";

export interface FetchImageStreamOptions {
  headers?: Record<string, string>;
}

export const fetchImageStream = async (
  imageUrl: string,
  options: FetchImageStreamOptions = {}
): Promise<Readable | null> => {
  try {
    console.log("Downloading image from URL:", imageUrl);

    const response = await api.get(imageUrl, {
      responseType: "arraybuffer",
      timeout: 30000,
      maxContentLength: 50 * 1024 * 1024,
      maxBodyLength: 50 * 1024 * 1024,
      headers: options.headers,
    });

    const contentType = response.headers["content-type"] as string | undefined;

    console.log("Image download completed:", {
      status: response.status,
      contentLength: response.headers["content-length"],
      contentType,
      bufferSize: response.data.length,
    });

    if (!response.data || response.data.length === 0) {
      console.error("Downloaded image buffer is empty");
      return null;
    }

    if (contentType && !contentType.toLowerCase().startsWith("image/")) {
      console.error(
        `Unexpected content-type "${contentType}" for ${imageUrl}; server likely returned an HTML/error page (hotlink protection?). Aborting.`
      );
      return null;
    }

    console.log("Starting image resize process...");
    const resizedStream = await resizeImageToTelegramLimit(response.data);

    if (!resizedStream) {
      console.error("Failed to resize image to Telegram limit");
      return null;
    }

    console.log("Image processing completed successfully");
    return resizedStream;
  } catch (err) {
    console.error("Error in fetchImageStream:", err);
    console.error("Error details:", {
      message: err instanceof Error ? err.message : "Unknown error",
      stack: err instanceof Error ? err.stack : undefined,
      imageUrl: imageUrl,
    });
    return null;
  }
};
