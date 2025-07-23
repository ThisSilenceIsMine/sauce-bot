import { api } from '../api';
import { Readable } from 'stream';
import { resizeImageToTelegramLimit } from './resizeImage';

/**
 * Download an image from a URL and create a resized stream for Telegram.
 * This function assumes the image URL has already been extracted from Danbooru API.
 */
export const fetchDanbooruImageStream = async (
  imageUrl: string
): Promise<Readable | null> => {
  try {
    console.log('Downloading image from URL:', imageUrl);

    // Fetch the image
    const response = await api.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 30000, // 30 second timeout
      maxContentLength: 50 * 1024 * 1024, // 50MB max
      maxBodyLength: 50 * 1024 * 1024, // 50MB max
    });

    console.log('Image download completed:', {
      status: response.status,
      contentLength: response.headers['content-length'],
      contentType: response.headers['content-type'],
      bufferSize: response.data.length,
    });

    if (!response.data || response.data.length === 0) {
      console.error('Downloaded image buffer is empty');
      return null;
    }

    console.log('Starting image resize process...');
    const resizedStream = await resizeImageToTelegramLimit(response.data);

    if (!resizedStream) {
      console.error('Failed to resize image to Telegram limit');
      return null;
    }

    console.log('Image processing completed successfully');
    return resizedStream;
  } catch (err) {
    console.error('Error in fetchDanbooruImageStream:', err);
    console.error('Error details:', {
      message: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : undefined,
      imageUrl: imageUrl,
    });
    return null;
  }
};
