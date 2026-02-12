import { NormalizedPercentage } from "../../../aliases.js";

export interface AssetManifestEntry {
  versionData: AssetVersionData;
  percentFetched: NormalizedPercentage;
}

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
