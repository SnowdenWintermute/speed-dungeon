import { AssetId } from "../index.js";
import { VersionedAsset } from "../versioned-asset.js";

const DB_NAME = "asset-cache";
const STORE_NAME = "assets";
const DB_VERSION = 1;

interface IndexedDbAssetRecord {
  id: string;
  bytes: ArrayBuffer;
  sizeBytes: number;
  hash: string;
}

export class IndexedDbVersionedAssetRepo {
  private dbPromise: Promise<IDBDatabase>;

  constructor(private readonly indexedDB: IDBFactory) {
    this.dbPromise = this.open();
  }

  async clear() {
    const databases = await this.indexedDB.databases();

    for (const db of databases) {
      if (db.name) {
        indexedDB.deleteDatabase(db.name);
        console.info(`Deleted database: ${db.name}`);
      }
    }
  }

  private open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = this.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async findById(id: string): Promise<VersionedAsset | undefined> {
    const db = await this.dbPromise;

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        const record = request.result as IndexedDbAssetRecord | undefined;
        if (!record) {
          resolve(undefined);
          return;
        }

        resolve(
          new VersionedAsset(record.bytes, {
            sizeBytes: record.sizeBytes,
            hash: record.hash,
          })
        );
      };

      request.onerror = () => reject(request.error);
    });
  }

  async getAllKeys(): Promise<Set<AssetId>> {
    const db = await this.dbPromise;

    return new Promise<Set<AssetId>>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);

      const request = store.getAllKeys();

      request.onsuccess = () => {
        resolve(new Set(request.result as AssetId[]));
      };

      request.onerror = () => reject(request.error);
    });
  }

  async insert(id: string, asset: VersionedAsset): Promise<void> {
    const db = await this.dbPromise;

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);

      const record: IndexedDbAssetRecord = {
        id,
        bytes: asset.bytes,
        sizeBytes: asset.versionData.sizeBytes,
        hash: asset.versionData.hash,
      };

      store.put(record);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  async delete(id: string): Promise<void> {
    const db = await this.dbPromise;

    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);

      store.delete(id);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }
}
