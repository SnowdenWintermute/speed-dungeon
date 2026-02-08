import { AssetId } from "../index.js";
import { AssetStore } from "./index.js";
import path from "path";
import fs from "fs";

export class NodeFileSystemAssetStore implements AssetStore {
  private baseRealPath = "";
  constructor(private readonly baseDir: string) {}

  async getAssetBytes(assetId: AssetId): Promise<ArrayBuffer> {
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
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  }

  async getAssetBytesOption(assetId: AssetId): Promise<ArrayBuffer | undefined> {
    try {
      return await this.getAssetBytes(assetId);
    } catch (error) {
      if (error instanceof Error && (error as NodeJS.ErrnoException).code === "ENOENT") {
        return undefined;
      }
      throw error;
    }
  }

  async cacheAsset(): Promise<void> {
    // @TODO
  }
}
