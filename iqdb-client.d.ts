declare module "iqdb-client" {
  import type { Readable } from "node:stream";

  export interface Size {
    width: number;
    height: number;
  }

  export interface IQDBSearchResultItem {
    head: string;
    sourceUrl?: string;
    img?: string;
    name?: string;
    similarity: number | null;
    size: Size;
    type: string | null;
    source?: string[];
  }

  export type IQDBSearchResult =
    | { ok: true; data: IQDBSearchResultItem[]; service: number[] }
    | { ok: false; err: string };

  export interface IQDBClientConfig {
    baseDomain: string;
    similarityPass: number;
    userAgent: string;
    fetchOptions?: RequestInit;
  }

  export const defaultConfig: IQDBClientConfig;

  export function makeSearchFunc(
    config: Partial<IQDBClientConfig>
  ): (
    pic: string | Buffer | Readable,
    options: { lib: string; forcegray?: boolean; fileName?: string; service?: number[] }
  ) => Promise<IQDBSearchResult>;

  export default function searchPic(
    pic: string | Buffer | Readable,
    options: { lib: string; forcegray?: boolean; fileName?: string; service?: number[] }
  ): Promise<IQDBSearchResult>;
}
