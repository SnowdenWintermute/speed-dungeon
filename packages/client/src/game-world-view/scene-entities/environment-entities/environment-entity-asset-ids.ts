import { AssetId, EnvironmentEntityName } from "@speed-dungeon/common";

export const ENVIRONMENT_MODELS_FOLDER = "environment/";

export const ENVIRONMENT_MODEL_ASSET_IDS: Record<EnvironmentEntityName, string> = {
  [EnvironmentEntityName.VendingMachine]: "vending-machine-custom.glb",
};

export function getEnvironmentModelAssetId(name: EnvironmentEntityName) {
  return `${ENVIRONMENT_MODELS_FOLDER}${ENVIRONMENT_MODEL_ASSET_IDS[name]}` as AssetId;
}
