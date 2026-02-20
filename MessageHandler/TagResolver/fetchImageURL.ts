import { api } from "../api";
import { Readable } from "stream";
import { resizeImageToTelegramLimit } from "./resizeImage";

const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB Telegram bot limit for videos

export const fetchImageStream = async (
  imageUrl: string
): Promise<Readable | null> => {
  try {
    console.log("Downloading image from URL:", imageUrl);

    const response = await api.get(imageUrl, {
      responseType: "arraybuffer",
      timeout: 30000,
      maxContentLength: 50 * 1024 * 1024,
      maxBodyLength: 50 * 1024 * 1024,
    });

    console.log("Image download completed:", {
      status: response.status,
      contentLength: response.headers["content-length"],
      contentType: response.headers["content-type"],
      bufferSize: response.data.length,
    });

    if (!response.data || response.data.length === 0) {
      console.error("Downloaded image buffer is empty");
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

export const fetchVideoBuffer = async (
  videoUrl: string
): Promise<Buffer | null> => {
  try {
    console.log("Downloading video from URL:", videoUrl);

    const response = await api.get(videoUrl, {
      responseType: "arraybuffer",
      timeout: 60000,
      maxContentLength: MAX_VIDEO_SIZE,
      maxBodyLength: MAX_VIDEO_SIZE,
    });

    console.log("Video download completed:", {
      status: response.status,
      contentLength: response.headers["content-length"],
      contentType: response.headers["content-type"],
      bufferSize: response.data.length,
    });

    if (!response.data || response.data.length === 0) {
      console.error("Downloaded video buffer is empty");
      return null;
    }

    if (response.data.length > MAX_VIDEO_SIZE) {
      console.error(
        `Video too large: ${response.data.length / 1024 / 1024}MB (max ${MAX_VIDEO_SIZE / 1024 / 1024}MB)`
      );
      return null;
    }

    return Buffer.from(response.data);
  } catch (err) {
    console.error("Error in fetchVideoBuffer:", err);
    console.error("Error details:", {
      message: err instanceof Error ? err.message : "Unknown error",
      stack: err instanceof Error ? err.stack : undefined,
      videoUrl,
    });
    return null;
  }
};
