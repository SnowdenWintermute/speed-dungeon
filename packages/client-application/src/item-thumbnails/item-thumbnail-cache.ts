import { ItemThumbnailKey } from "@speed-dungeon/common";

export type ImageString = string;

/** Persists rendered thumbnails between sessions. Base class to be extended based on the runtime
 * (IndexedDB in a browser, the file system in electron). */
export abstract class ItemThumbnailCache {
  abstract getOption(key: ItemThumbnailKey): Promise<ImageString | undefined>;
  abstract set(key: ItemThumbnailKey, image: ImageString): Promise<void>;
  abstract clear(): Promise<void>;

  /** Discards everything if the thumbnails were rendered by a different version of the app or
   * against different model files. */
  abstract discardIfStale(assetManifestFingerprint: string): Promise<void>;

  dispose(): void {}
}
