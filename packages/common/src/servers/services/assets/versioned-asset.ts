import { NormalizedPercentage } from "../../../aliases.js";
import { AssetId } from "./index.js";

export type AssetManifest = Record<AssetId, AssetVersionData>;

// export interface AssetManifestEntry {
//   versionData: AssetVersionData;
//   percentFetched: NormalizedPercentage;
// }

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
