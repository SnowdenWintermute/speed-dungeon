import { Color3, ISceneLoaderAsyncResult, StandardMaterial } from "@babylonjs/core";
import { GameWorld } from ".";

export const DEFAULT_MATERIAL_COLORS: { [name: string]: Color3 } = {
  Main: new Color3(0.792, 0.761, 0.694),
  Alternate: new Color3(0.259, 0.208, 0.18),
  Accent1: new Color3(0.482, 0.486, 0.467),
  Accent2: new Color3(0.278, 0.518, 0.447),
  Handle: new Color3(0.169, 0.145, 0.11),
  Hilt: new Color3(0.2, 0.204, 0.204),
  Blade: new Color3(0.6, 0.6, 0.55),
};

export function createDefaultMaterials() {
  const toReturn: { [materialName: string]: StandardMaterial } = {};
  for (const [name, color] of Object.entries(DEFAULT_MATERIAL_COLORS)) {
    const material = new StandardMaterial(name);
    material.diffuseColor = color;
    material.roughness = 1;
    toReturn[name] = material;
  }

  return toReturn;
}

export default function setDefaultMaterials(world: GameWorld, model: ISceneLoaderAsyncResult) {
  for (const [name, color] of Object.entries(DEFAULT_MATERIAL_COLORS)) {
    for (const mesh of model.meshes) {
      if (mesh.material?.name === name) {
        const materialOption = world.defaultMaterials[name];
        if (materialOption) mesh.material = materialOption;
      }
    }
  }
}
