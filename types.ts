export type SauceNAOResponse = {
  header: {
    user_id: string;
    account_type: string;
    short_limit: string;
    long_limit: string;
    long_remaining: number;
    short_remaining: number;
    status: number;
    results_requested: number;
    search_depth: string;
    minimum_similarity: number;
    query_image: string;
    query_image_display: string;
    results_returned: number;
    index: {
      [key: string]: {
        status: number;
        parent_id: number;
        id: number;
        results: number;
      };
    };
  };
  results: {
    header: {
      similarity: string;
      thumbnail: string;
      index_id: number;
      index_name: string;
      dupes: number;
      hidden: number;
    };
    data: {
      ext_urls?: string[];
      danbooru_id?: number;
      creator?: string;
      material?: string;
      characters?: string;
      source?: string;
    };
  }[];
};

export type PostInfo = {
  characters: string[];
  authors: string[];
};
