export interface AssetVersionData {
  sizeBytes: number;
  version: number;
}

export class VersionedAsset {
  constructor(
    public bytes: ArrayBuffer,
    public versionData: AssetVersionData
  ) {}
}
