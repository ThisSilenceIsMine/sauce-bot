import sharp from 'sharp';
import { Readable } from 'stream';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
const MIN_WIDTH = 800;

/**
 * Resizes an image buffer to fit within Telegram's 10MB limit while maintaining aspect ratio
 * @param imageBuffer The original image buffer
 * @returns A Readable stream of the resized image, or null if resizing failed
 */
export const resizeImageToTelegramLimit = async (
  imageBuffer: Buffer
): Promise<Readable | null> => {
  try {
    const fileSize = imageBuffer.length;
    console.log(
      `Processing image: ${fileSize / 1024 / 1024}MB (${fileSize} bytes)`
    );

    if (fileSize <= MAX_FILE_SIZE) {
      // If under limit, return as stream directly
      console.log('Image is under size limit, returning original');
      return Readable.from(imageBuffer);
    }

    // If over limit, resize with Sharp
    console.log(
      `Image size ${fileSize / 1024 / 1024}MB exceeds limit, resizing...`
    );

    const image = sharp(imageBuffer);
    console.log('Sharp instance created successfully');

    const metadata = await image.metadata();
    console.log('Image metadata:', {
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
      console.error('Could not get image dimensions from metadata');
      return null;
    }

    // Calculate new dimensions while maintaining aspect ratio
    const aspectRatio = metadata.width / metadata.height;
    let newWidth = metadata.width;
    let newHeight = metadata.height;
    let resizeAttempts = 0;
    const maxAttempts = 10;

    console.log(
      `Starting resize: ${newWidth}x${newHeight} (aspect ratio: ${aspectRatio.toFixed(
        3
      )})`
    );

    // Gradually reduce size until file is under limit
    while (resizeAttempts < maxAttempts) {
      resizeAttempts++;
      newWidth = Math.floor(newWidth * 0.9);
      newHeight = Math.floor(newWidth / aspectRatio);

      console.log(`Resize attempt ${resizeAttempts}: ${newWidth}x${newHeight}`);

      try {
        const resized = await image
          .resize(newWidth, newHeight)
          .jpeg({ quality: 85 })
          .toBuffer();

        console.log(
          `Resize attempt ${resizeAttempts} result: ${
            resized.length / 1024 / 1024
          }MB`
        );

        if (resized.length <= MAX_FILE_SIZE) {
          console.log(
            `Successfully resized to ${newWidth}x${newHeight} (${
              resized.length / 1024 / 1024
            }MB)`
          );
          return Readable.from(resized);
        }

        // If dimensions get too small, give up
        if (newWidth < MIN_WIDTH) {
          console.error(
            `Could not resize image enough to meet size limit. Final size: ${newWidth}x${newHeight} (min: ${MIN_WIDTH})`
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
    console.error('Error in resizeImageToTelegramLimit:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      bufferLength: imageBuffer?.length || 'undefined',
    });
    return null;
  }
};
