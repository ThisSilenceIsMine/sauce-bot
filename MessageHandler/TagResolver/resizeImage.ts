import sharp from "sharp";
import { Readable } from "stream";

sharp.cache(false);

sharp.concurrency(1);

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_WIDTH_HEIGHT_SUM = 10000;
const MAX_ASPECT_RATIO = 20;
const JPEG_QUALITY_STEPS = [85, 75, 60, 45];

const formatMB = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)}MB`;

/**
 * Resizes an image buffer to fit within Telegram's photo limits:
 * - File size ≤ 10MB
 * - Width + Height ≤ 10000
 * - Aspect ratio ≤ 20
 *
 * Computes the target dimensions in one shot from the constraint
 * (width+height ≤ 10000) instead of iteratively shrinking, which kept
 * decoding multi-megapixel PNGs and OOM-killed the container.
 */
export const resizeImageToTelegramLimit = async (
  imageBuffer: Buffer,
): Promise<Readable | null> => {
  try {
    const fileSize = imageBuffer.length;
    console.log(`Processing image: ${formatMB(fileSize)} (${fileSize} bytes)`);

    const metadata = await sharp(imageBuffer).metadata();
    console.log("Image metadata:", {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      space: metadata.space,
      channels: metadata.channels,
      hasAlpha: metadata.hasAlpha,
    });

    const { width, height } = metadata;
    if (!width || !height) {
      console.error("Could not get image dimensions from metadata");
      return null;
    }

    const aspectRatio = width / height;
    const reverseAspectRatio = height / width;
    const widthHeightSum = width + height;

    if (
      aspectRatio > MAX_ASPECT_RATIO ||
      reverseAspectRatio > MAX_ASPECT_RATIO
    ) {
      console.error(
        `Aspect ratio ${aspectRatio.toFixed(2)} exceeds Telegram limit ${MAX_ASPECT_RATIO}; cannot post`,
      );
      return null;
    }

    if (fileSize <= MAX_FILE_SIZE && widthHeightSum <= MAX_WIDTH_HEIGHT_SUM) {
      console.log("Image meets all Telegram requirements, returning original");
      return Readable.from(imageBuffer);
    }

    let targetWidth = width;
    let targetHeight = height;
    if (widthHeightSum > MAX_WIDTH_HEIGHT_SUM) {
      const scale = MAX_WIDTH_HEIGHT_SUM / widthHeightSum;
      targetWidth = Math.floor(width * scale);
      targetHeight = Math.floor(height * scale);
    }

    console.log(
      `Resizing ${width}x${height} → ${targetWidth}x${targetHeight} (sum ${targetWidth + targetHeight})`,
    );

    const needsResize = targetWidth !== width || targetHeight !== height;

    for (const quality of JPEG_QUALITY_STEPS) {
      let pipeline = sharp(imageBuffer).rotate();
      if (needsResize) {
        pipeline = pipeline.resize(targetWidth, targetHeight, {
          fit: "inside",
          withoutEnlargement: true,
        });
      }

      const out = await pipeline.jpeg({ quality }).toBuffer();
      console.log(
        `JPEG q=${quality}: ${formatMB(out.length)} at ${targetWidth}x${targetHeight}`,
      );

      if (out.length <= MAX_FILE_SIZE) {
        return Readable.from(out);
      }
    }

    console.error(
      `Could not bring image under ${formatMB(MAX_FILE_SIZE)} even at lowest JPEG quality`,
    );
    return null;
  } catch (error) {
    console.error("Error in resizeImageToTelegramLimit:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      bufferLength: imageBuffer?.length || "undefined",
    });
    return null;
  }
};
