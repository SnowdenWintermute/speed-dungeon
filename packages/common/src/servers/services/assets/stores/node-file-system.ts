import { AssetId } from "../index.js";
import { AssetCache } from "./index.js";
import path from "path";
import fs from "fs";
import { VersionedAsset } from "../versioned-asset.js";
import { createHash } from "crypto";

function hashArrayBuffer(bytes: ArrayBuffer): string {
  const hash = createHash("sha256");
  hash.update(Buffer.from(bytes));
  return hash.digest("hex");
}

export class NodeFileSystemAssetStore extends AssetCache {
  constructor(private readonly baseDir: string) {
    super();
  }

  removeAsset(assetId: AssetId): Promise<void> {
    throw new Error("Method not implemented.");
  }

  getAssetIdsCached(): Promise<Set<AssetId>> {
    throw new Error("Method not implemented.");
  }

  async getAsset(assetId: AssetId): Promise<VersionedAsset> {
    console.log(process.cwd());
    const baseRealPath = await fs.promises.realpath(this.baseDir);

    const candidatePath = path.resolve(baseRealPath, assetId);
    const candidateRealPath = await fs.promises.realpath(candidatePath);
    const relative = path.relative(baseRealPath, candidateRealPath);
    console.log("relative:", relative);

    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      throw new Error("Directory traversal attempt");
    }

    const buffer = await fs.promises.readFile(candidateRealPath);
    const bytes = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

    return new VersionedAsset(bytes, { hash: hashArrayBuffer(bytes), sizeBytes: bytes.byteLength });
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
    throw new Error("not implemented, expect files to be placed manually");
  }
}
