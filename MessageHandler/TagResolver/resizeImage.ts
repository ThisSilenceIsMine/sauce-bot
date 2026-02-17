import { Transformer } from '@napi-rs/image';
import { Readable } from 'stream';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MIN_WIDTH = 800;
const MAX_WIDTH_HEIGHT_SUM = 10000;
const MAX_ASPECT_RATIO = 20;

export const resizeImageToTelegramLimit = async (
  imageBuffer: Buffer
): Promise<Readable | null> => {
  try {
    const fileSize = imageBuffer.length;
    console.log(
      `Processing image: ${fileSize / 1024 / 1024}MB (${fileSize} bytes)`
    );

    const metadata = await new Transformer(imageBuffer).metadata();
    console.log('Image metadata:', {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      colorType: metadata.colorType,
    });

    if (!metadata.width || !metadata.height) {
      console.error('Could not get image dimensions from metadata');
      return null;
    }

    const aspectRatio = metadata.width / metadata.height;
    const reverseAspectRatio = metadata.height / metadata.width;
    const widthHeightSum = metadata.width + metadata.height;

    const meetsSizeLimit = fileSize <= MAX_FILE_SIZE;
    const meetsDimensionLimit = widthHeightSum <= MAX_WIDTH_HEIGHT_SUM;
    const meetsAspectRatioLimit =
      aspectRatio <= MAX_ASPECT_RATIO && reverseAspectRatio <= MAX_ASPECT_RATIO;

    console.log('Telegram requirements check:', {
      fileSize: `${fileSize / 1024 / 1024}MB (≤${MAX_FILE_SIZE / 1024 / 1024}MB): ${meetsSizeLimit ? '✅' : '❌'}`,
      widthHeightSum: `${widthHeightSum} (≤${MAX_WIDTH_HEIGHT_SUM}): ${meetsDimensionLimit ? '✅' : '❌'}`,
      aspectRatio: `${aspectRatio.toFixed(2)} (≤${MAX_ASPECT_RATIO}): ${meetsAspectRatioLimit ? '✅' : '❌'}`,
    });

    if (meetsSizeLimit && meetsDimensionLimit && meetsAspectRatioLimit) {
      console.log('Image meets all Telegram requirements, returning original');
      return Readable.from(imageBuffer);
    }

    console.log('Image does not meet all Telegram requirements, resizing...');

    let newWidth = metadata.width;
    let newHeight = metadata.height;
    let resizeAttempts = 0;
    const maxAttempts = 15;

    console.log(
      `Starting resize: ${newWidth}x${newHeight} (aspect ratio: ${aspectRatio.toFixed(3)})`
    );

    while (resizeAttempts < maxAttempts) {
      resizeAttempts++;

      newWidth = Math.floor(newWidth * 0.9);
      newHeight = Math.floor(newHeight * 0.9);

      console.log(`Resize attempt ${resizeAttempts}: ${newWidth}x${newHeight}`);

      try {
        const resized = await new Transformer(imageBuffer)
          .resize(newWidth, newHeight)
          .jpeg(85);

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
          `Resize attempt ${resizeAttempts} result: ${resizedSize / 1024 / 1024}MB, ${newWidth}x${newHeight}, aspect: ${resizedAspectRatio.toFixed(2)}`
        );
        console.log('Resized image requirements check:', {
          fileSize: `${resizedSize / 1024 / 1024}MB (≤${MAX_FILE_SIZE / 1024 / 1024}MB): ${meetsResizedSizeLimit ? '✅' : '❌'}`,
          widthHeightSum: `${resizedWidthHeightSum} (≤${MAX_WIDTH_HEIGHT_SUM}): ${meetsResizedDimensionLimit ? '✅' : '❌'}`,
          aspectRatio: `${resizedAspectRatio.toFixed(2)} (≤${MAX_ASPECT_RATIO}): ${meetsResizedAspectRatioLimit ? '✅' : '❌'}`,
        });

        if (
          meetsResizedSizeLimit &&
          meetsResizedDimensionLimit &&
          meetsResizedAspectRatioLimit
        ) {
          console.log(
            `Successfully resized to ${newWidth}x${newHeight} (${resizedSize / 1024 / 1024}MB)`
          );
          return Readable.from(resized);
        }

        if (newWidth < MIN_WIDTH || newHeight < MIN_WIDTH) {
          console.error(
            `Could not resize image enough to meet all Telegram requirements. Final size: ${newWidth}x${newHeight} (min: ${MIN_WIDTH})`
          );
          return null;
        }
      } catch (resizeError) {
        console.error(`Resize attempt ${resizeAttempts} failed:`, resizeError);
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
