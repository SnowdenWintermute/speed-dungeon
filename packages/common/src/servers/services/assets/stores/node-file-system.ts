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

  async getAssetIdsCached(): Promise<Set<AssetId>> {
    const results = new Set<AssetId>();
    this.walkDirectory(this.baseDir, results);
    return results;
  }

  private walkDirectory(directory: string, results: Set<AssetId>) {
    const entries = fs.readdirSync(directory, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        this.walkDirectory(fullPath, results);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      // Convert to logical id
      const relativePath = path.relative(this.baseDir, fullPath);

      // Normalize to forward slashes for cross-platform consistency
      const logicalId = relativePath.split(path.sep).join("/");

      results.add(logicalId as AssetId);
    }
  }

  async getAsset(assetId: AssetId): Promise<VersionedAsset> {
    const baseRealPath = await fs.promises.realpath(this.baseDir);

    const candidatePath = path.resolve(baseRealPath, assetId);
    const candidateRealPath = await fs.promises.realpath(candidatePath);
    const relative = path.relative(baseRealPath, candidateRealPath);

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
