import { LoadAssetContainerAsync, Scene } from "@babylonjs/core";
import { AssetId, ClientAppAssetService } from "@speed-dungeon/common";

export async function loadAssetContainerIntoScene(
  assetService: ClientAppAssetService,
  scene: Scene,
  assetId: AssetId
) {
  if (assetId === "") {
    throw new Error("Empty file path");
  }

  const buffer = await assetService.getAsset(assetId);
  const assetContainer = await LoadAssetContainerAsync(new Uint8Array(buffer), scene, {
    pluginExtension: ".glb",
  });

  assetContainer.addToScene();

  return assetContainer;
}
