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
  const fileSize = imageBuffer.length;
  if (fileSize <= MAX_FILE_SIZE) {
    // If under limit, return as stream directly
    return Readable.from(imageBuffer);
  }

  // If over limit, resize with Sharp
  console.log(
    `Image size ${fileSize / 1024 / 1024}MB exceeds limit, resizing...`
  );
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    console.log('Could not get image dimensions');
    return null;
  }

  // Calculate new dimensions while maintaining aspect ratio
  const aspectRatio = metadata.width / metadata.height;
  let newWidth = metadata.width;
  let newHeight = metadata.height;

  // Gradually reduce size until file is under limit
  while (true) {
    newWidth = Math.floor(newWidth * 0.9);
    newHeight = Math.floor(newWidth / aspectRatio);

    const resized = await image
      .resize(newWidth, newHeight)
      .jpeg({ quality: 85 })
      .toBuffer();

    if (resized.length <= MAX_FILE_SIZE) {
      console.log(`Resized to ${newWidth}x${newHeight}`);
      return Readable.from(resized);
    }

    // If dimensions get too small, give up
    if (newWidth < MIN_WIDTH) {
      console.log('Could not resize image enough to meet size limit');
      return null;
    }
  }
};
