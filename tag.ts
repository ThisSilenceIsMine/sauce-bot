import { fetchDanbooruTags } from './fetchDanbooruTags';
import { getSauceNAO } from './getSauce';

export const queryImage = async (filePath: string): Promise<string[]> => {
  const results = await getSauceNAO(filePath);

  return results;
};
