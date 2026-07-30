import { IndexedDbConnection } from "../../../../utils/indexed-db-connection.js";
import { AssetId } from "../index.js";
import { VersionedAsset } from "../versioned-asset.js";

const DB_NAME = "asset-cache";
const STORE_NAME = "assets";
const DB_VERSION = 2;

interface IndexedDbAssetRecord {
  bytes: ArrayBuffer;
  sizeBytes: number;
  hash: string;
}

export class IndexedDbVersionedAssetRepo {
  private connection: IndexedDbConnection;

  constructor(indexedDB: IDBFactory) {
    this.connection = new IndexedDbConnection(indexedDB, DB_NAME, DB_VERSION, [STORE_NAME]);
  }

  dispose() {
    this.connection.dispose();
  }

  async clear() {
    await this.connection.deleteDatabase();
  }

  async findById(id: AssetId): Promise<VersionedAsset | undefined> {
    const record = await this.connection.getOption<IndexedDbAssetRecord>(STORE_NAME, id);
    if (record === undefined) {
      return undefined;
    }

    return new VersionedAsset(record.bytes, { sizeBytes: record.sizeBytes, hash: record.hash });
  }

  async getAllKeys(): Promise<Set<AssetId>> {
    return new Set(await this.connection.getAllKeys<AssetId>(STORE_NAME));
  }

  async insert(id: AssetId, asset: VersionedAsset): Promise<void> {
    const record: IndexedDbAssetRecord = {
      bytes: asset.bytes,
      sizeBytes: asset.versionData.sizeBytes,
      hash: asset.versionData.hash,
    };

    await this.connection.put(STORE_NAME, id, record);
  }

  async delete(id: AssetId): Promise<void> {
    await this.connection.delete(STORE_NAME, id);
  }
}
