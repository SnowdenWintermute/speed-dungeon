import { AssetId } from "./index.js";

export type AssetManifest = Record<AssetId, AssetVersionData>;

export class VersionedAsset {
  constructor(
    public bytes: ArrayBuffer,
    public versionData: AssetVersionData
  ) {}
}

export interface AssetVersionData {
  sizeBytes: number;
  hash: string;
}
