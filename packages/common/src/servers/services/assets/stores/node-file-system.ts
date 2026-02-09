import { AssetId, VersionedAsset } from "../index.js";
import { AssetCache } from "./index.js";
import path from "path";
import fs from "fs";

export class NodeFileSystemAssetStore implements AssetCache {
  private baseRealPath = "";
  constructor(private readonly baseDir: string) {}

  async getAsset(assetId: AssetId): Promise<VersionedAsset> {
    if (!this.baseRealPath) {
      this.baseRealPath = await fs.promises.realpath(this.baseDir);
    }

    const candidatePath = path.resolve(this.baseRealPath, assetId);
    const candidateRealPath = await fs.promises.realpath(candidatePath);
    const relative = path.relative(this.baseRealPath, candidateRealPath);

    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      throw new Error("Directory traversal attempt");
    }

    const buffer = await fs.promises.readFile(candidateRealPath);
    const bytes = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

    // @TODO - actually get version from file metadata

    return new VersionedAsset(bytes, { version: 1, sizeBytes: bytes.byteLength });
  }

  async getAssetOption(assetId: AssetId): Promise<VersionedAsset | undefined> {
    try {
      return await this.getAsset(assetId);
    } catch (error) {
      if (error instanceof Error && (error as NodeJS.ErrnoException).code === "ENOENT") {
        return undefined;
      }
      throw error;
    }
  }

  async cacheAsset(): Promise<void> {
    // @TODO
    // - store file with bytes and version metadata
    // - probably do this by hand in file system, just put files in folders
  }
}
