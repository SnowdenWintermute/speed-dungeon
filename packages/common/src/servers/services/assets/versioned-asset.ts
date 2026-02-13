import { NormalizedPercentage } from "../../../aliases.js";
import { AssetId } from "./index.js";

export interface AssetManifestEntry {
  versionData: AssetVersionData;
  percentFetched: NormalizedPercentage;
}

export type AssetManifest = Map<AssetId, AssetManifestEntry>;

export class VersionedAsset {
  constructor(
    public bytes: ArrayBuffer,
    public versionData: AssetVersionData
  ) {}
}

export interface AssetVersionData {
  sizeBytes: number;
  version: number;
}
