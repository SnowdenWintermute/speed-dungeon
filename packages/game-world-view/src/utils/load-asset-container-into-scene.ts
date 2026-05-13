import { LoadAssetContainerAsync, Scene } from "@babylonjs/core";
import { AssetId, ClientAppAssetService } from "@speed-dungeon/common";

export const SCENE_DISPOSED_BEFORE_ASSET_LOAD = "scene disposed before asset load";
export function isExpectedSceneDisposedError(unknownError: any) {
  return unknownError instanceof Error && unknownError.message === SCENE_DISPOSED_BEFORE_ASSET_LOAD;
}

export async function loadAssetContainerIntoScene(
  assetService: ClientAppAssetService,
  scene: Scene,
  assetId: AssetId
) {
  if (assetId === "") {
    throw new Error("Empty file path");
  }

  const buffer = await assetService.getAsset(assetId);
  if (scene.isDisposed) {
    throw new Error(SCENE_DISPOSED_BEFORE_ASSET_LOAD);
  }
  const assetContainer = await LoadAssetContainerAsync(new Uint8Array(buffer), scene, {
    pluginExtension: ".glb",
  });
  if (scene.isDisposed) {
    throw new Error(SCENE_DISPOSED_BEFORE_ASSET_LOAD);
  }

  assetContainer.addToScene();

  return assetContainer;
}
