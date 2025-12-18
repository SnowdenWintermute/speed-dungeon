
export const ENVIRONMENT_MODELS_FOLDER = "environment/";

export enum EnvironmentModelTypes {
  VendingMachine,
}

export const ENVIRONMENT_MODEL_PATHS: Record<EnvironmentModelTypes, string> = {
  [EnvironmentModelTypes.VendingMachine]: "/vending-machine-custom.glb",
};
