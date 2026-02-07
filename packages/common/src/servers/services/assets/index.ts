import { AssetStore } from "./stores/index.js";

// provide a way for GameServer to give URL and get a file (.glb, sound file, texture)
export type AssetId = string & { __brand: "AssetId" }; // models/monsters/manta-ray.glb

export interface AssetService {
  getAsset(assetId: AssetId): Promise<ArrayBuffer>;
}

interface AssetFetch {
  promise: Promise<ArrayBuffer>;
  priority: number;
  abort: () => void;
}

interface QueuedPrefetch {
  assetId: AssetId;
  priority: number;
}

export enum AssetFetchPriority {
  Urgent,
  PrefetchHigh,
  PrefetchLow,
}

export class ClientAppAssetService implements AssetService {
  private prefetchQueue: QueuedPrefetch[] = [];
  private fetchesInProgress = new Map<AssetId, AssetFetch>();

  constructor(
    private readonly remoteStore: AssetStore,
    private readonly cache: AssetStore,
    private readonly assetIdsByDefaultPrefetchPriority: QueuedPrefetch[],
    private readonly isOnline: () => boolean
  ) {}

  async getAsset(assetId: AssetId): Promise<ArrayBuffer> {
    throw new Error("not implemented");
  }

  async prefetchAssets() {
    throw new Error("not implemented");
  }

  private fetchAndCacheRemoteAsset(assetId: AssetId) {
    throw new Error("not implemented");
  }

  async getAssetIdVersions(): Promise<AssetId[]> {
    throw new Error("not implemented");
  }
}
