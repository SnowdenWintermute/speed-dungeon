import { APP_VERSION_NUMBER, IndexedDbConnection, ItemThumbnailKey } from "@speed-dungeon/common";
import { ImageString, ItemThumbnailCache } from "./item-thumbnail-cache";

const DB_NAME = "item-thumbnails";
const THUMBNAIL_STORE_NAME = "thumbnails";
const RENDERED_BY_STORE_NAME = "rendered-by";
const RENDERED_BY_KEY = "rendered-by";
const DB_VERSION = 1;

/** What the stored thumbnails were rendered by. Any difference means they can't be trusted. */
interface RenderedBy {
  appVersion: string;
  assetManifestFingerprint: string;
}

export class IndexedDbItemThumbnailCache extends ItemThumbnailCache {
  private connection: IndexedDbConnection;

  constructor(indexedDB: IDBFactory) {
    super();
    this.connection = new IndexedDbConnection(indexedDB, DB_NAME, DB_VERSION, [
      THUMBNAIL_STORE_NAME,
      RENDERED_BY_STORE_NAME,
    ]);
  }

  async getOption(key: ItemThumbnailKey) {
    return this.connection.getOption<ImageString>(THUMBNAIL_STORE_NAME, key);
  }

  async set(key: ItemThumbnailKey, image: ImageString) {
    await this.connection.put(THUMBNAIL_STORE_NAME, key, image);
  }

  async clear() {
    await this.connection.clear(THUMBNAIL_STORE_NAME);
  }

  async discardIfStale(assetManifestFingerprint: string) {
    const current: RenderedBy = { appVersion: APP_VERSION_NUMBER, assetManifestFingerprint };
    const stored = await this.connection.getOption<RenderedBy>(
      RENDERED_BY_STORE_NAME,
      RENDERED_BY_KEY
    );

    if (
      stored?.appVersion === current.appVersion &&
      stored?.assetManifestFingerprint === current.assetManifestFingerprint
    ) {
      return;
    }

    await this.clear();
    await this.connection.put(RENDERED_BY_STORE_NAME, RENDERED_BY_KEY, current);
  }

  override dispose() {
    this.connection.dispose();
  }
}
