"use client";
import {
  ClientAppAssetService,
  IndexedDbAssetStore,
  invariant,
  RemoteServerAssetStore,
} from "@speed-dungeon/common";

const assetServerUrl = process.env.NEXT_PUBLIC_ASSET_SERVER_URL;
let clientAppAssetService: ClientAppAssetService | null = null;

export function getClientAppAssetService() {
  invariant(assetServerUrl !== undefined, "no asset server url provided");
  if (!clientAppAssetService) {
    if (typeof window === "undefined") {
      throw new Error("ClientAppAssetService accessed on server");
    }

    const assetCache = new IndexedDbAssetStore(window.indexedDB);
    const remoteStore = new RemoteServerAssetStore(assetServerUrl);

    clientAppAssetService = new ClientAppAssetService(
      remoteStore,
      assetCache,
      new Map(),
      () => true
    );
  }

  return clientAppAssetService;
}
