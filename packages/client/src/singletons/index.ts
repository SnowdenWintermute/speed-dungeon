"use client";
import {
  ClientAppAssetService,
  IndexedDbAssetStore,
  invariant,
  RemoteServerAssetStore,
} from "@speed-dungeon/common";
import { ApplicationRuntimeEnvironmentManager } from "./application-runtime-environment-manager";
import { AppStore } from "@/mobx-stores/app-store";
import { gameClientSingleton, lobbyClientSingleton } from "./lobby-client";
// import { gameWorldView } from "@/app/game-world-view-canvas/SceneManager";
import { characterAutoFocusManager } from "./character-autofocus-manager";
import { gameWorldView } from "@/app/game-world-view-canvas/SceneManager";

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

let applicationRuntimeEnvironmentManager: ApplicationRuntimeEnvironmentManager | null = null;
export function getApplicationRuntimeManager() {
  if (!applicationRuntimeEnvironmentManager) {
    applicationRuntimeEnvironmentManager = new ApplicationRuntimeEnvironmentManager(
      AppStore.get(),
      lobbyClientSingleton,
      gameClientSingleton,
      gameWorldView,
      characterAutoFocusManager
    );
  }

  return applicationRuntimeEnvironmentManager;
}
