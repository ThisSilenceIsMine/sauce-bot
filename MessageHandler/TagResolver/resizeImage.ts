import sharp from "sharp";
import { Readable } from "stream";

sharp.cache(false);

sharp.concurrency(1);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
const MIN_WIDTH = 800;
const MAX_WIDTH_HEIGHT_SUM = 10000; // Telegram limit: width + height ≤ 10000
const MAX_ASPECT_RATIO = 20; // Telegram limit: width/height or height/width ≤ 20

/**
 * Resizes an image buffer to fit within Telegram's limits:
 * - File size ≤ 10MB
 * - Width + Height ≤ 10000
 * - Aspect ratio ≤ 20
 * @param imageBuffer The original image buffer
 * @returns A Readable stream of the resized image, or null if resizing failed
 */
export const resizeImageToTelegramLimit = async (
  imageBuffer: Buffer,
): Promise<Readable | null> => {
  try {
    const fileSize = imageBuffer.length;
    console.log(
      `Processing image: ${fileSize / 1024 / 1024}MB (${fileSize} bytes)`,
    );

    const image = sharp(imageBuffer);
    console.log("Sharp instance created successfully");

    const metadata = await image.metadata();
    console.log("Image metadata:", {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      space: metadata.space,
      channels: metadata.channels,
      depth: metadata.depth,
      density: metadata.density,
      hasProfile: metadata.hasProfile,
      hasAlpha: metadata.hasAlpha,
    });

    if (!metadata.width || !metadata.height) {
      console.error("Could not get image dimensions from metadata");
      return null;
    }

    // Check if image already meets all Telegram requirements
    const aspectRatio = metadata.width / metadata.height;
    const reverseAspectRatio = metadata.height / metadata.width;
    const widthHeightSum = metadata.width + metadata.height;

    const meetsSizeLimit = fileSize <= MAX_FILE_SIZE;
    const meetsDimensionLimit = widthHeightSum <= MAX_WIDTH_HEIGHT_SUM;
    const meetsAspectRatioLimit =
      aspectRatio <= MAX_ASPECT_RATIO && reverseAspectRatio <= MAX_ASPECT_RATIO;

    console.log("Telegram requirements check:", {
      fileSize: `${fileSize / 1024 / 1024}MB (≤${
        MAX_FILE_SIZE / 1024 / 1024
      }MB): ${meetsSizeLimit ? "✅" : "❌"}`,
      widthHeightSum: `${widthHeightSum} (≤${MAX_WIDTH_HEIGHT_SUM}): ${
        meetsDimensionLimit ? "✅" : "❌"
      }`,
      aspectRatio: `${aspectRatio.toFixed(2)} (≤${MAX_ASPECT_RATIO}): ${
        meetsAspectRatioLimit ? "✅" : "❌"
      }`,
    });

    if (meetsSizeLimit && meetsDimensionLimit && meetsAspectRatioLimit) {
      // If all requirements met, return as stream directly
      console.log("Image meets all Telegram requirements, returning original");
      return Readable.from(imageBuffer);
    }

    // If any requirement not met, resize with Sharp
    console.log("Image does not meet all Telegram requirements, resizing...");

    // Calculate new dimensions while maintaining aspect ratio and meeting all limits
    let newWidth = metadata.width;
    let newHeight = metadata.height;
    let resizeAttempts = 0;
    const maxAttempts = 15; // Increased attempts for more complex requirements

    console.log(
      `Starting resize: ${newWidth}x${newHeight} (aspect ratio: ${aspectRatio.toFixed(
        3,
      )})`,
    );

    // Gradually reduce size until all requirements are met
    while (resizeAttempts < maxAttempts) {
      resizeAttempts++;

      // Reduce dimensions by 10% each attempt
      newWidth = Math.floor(newWidth * 0.9);
      newHeight = Math.floor(newHeight * 0.9);

      console.log(`Resize attempt ${resizeAttempts}: ${newWidth}x${newHeight}`);

      try {
        const resized = await image
          .resize(newWidth, newHeight)
          .jpeg({ quality: 85 })
          .toBuffer();

        const resizedSize = resized.length;
        const resizedAspectRatio = newWidth / newHeight;
        const resizedReverseAspectRatio = newHeight / newWidth;
        const resizedWidthHeightSum = newWidth + newHeight;

        const meetsResizedSizeLimit = resizedSize <= MAX_FILE_SIZE;
        const meetsResizedDimensionLimit =
          resizedWidthHeightSum <= MAX_WIDTH_HEIGHT_SUM;
        const meetsResizedAspectRatioLimit =
          resizedAspectRatio <= MAX_ASPECT_RATIO &&
          resizedReverseAspectRatio <= MAX_ASPECT_RATIO;

        console.log(
          `Resize attempt ${resizeAttempts} result: ${
            resizedSize / 1024 / 1024
          }MB, ${newWidth}x${newHeight}, aspect: ${resizedAspectRatio.toFixed(
            2,
          )}`,
        );
        console.log("Resized image requirements check:", {
          fileSize: `${resizedSize / 1024 / 1024}MB (≤${
            MAX_FILE_SIZE / 1024 / 1024
          }MB): ${meetsResizedSizeLimit ? "✅" : "❌"}`,
          widthHeightSum: `${resizedWidthHeightSum} (≤${MAX_WIDTH_HEIGHT_SUM}): ${
            meetsResizedDimensionLimit ? "✅" : "❌"
          }`,
          aspectRatio: `${resizedAspectRatio.toFixed(
            2,
          )} (≤${MAX_ASPECT_RATIO}): ${
            meetsResizedAspectRatioLimit ? "✅" : "❌"
          }`,
        });

        if (
          meetsResizedSizeLimit &&
          meetsResizedDimensionLimit &&
          meetsResizedAspectRatioLimit
        ) {
          console.log(
            `Successfully resized to ${newWidth}x${newHeight} (${
              resizedSize / 1024 / 1024
            }MB)`,
          );
          return Readable.from(resized);
        }

        // If dimensions get too small, give up
        if (newWidth < MIN_WIDTH || newHeight < MIN_WIDTH) {
          console.error(
            `Could not resize image enough to meet all Telegram requirements. Final size: ${newWidth}x${newHeight} (min: ${MIN_WIDTH})`,
          );
          return null;
        }
      } catch (resizeError) {
        console.error(`Resize attempt ${resizeAttempts} failed:`, resizeError);
        // Continue to next attempt
      }
    }

    console.error(`Failed to resize image after ${maxAttempts} attempts`);
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
