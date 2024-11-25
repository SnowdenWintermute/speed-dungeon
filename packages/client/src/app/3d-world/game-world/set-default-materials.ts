import { Color3, ISceneLoaderAsyncResult, StandardMaterial } from "@babylonjs/core";
import { GameWorld } from ".";
import { EquipmentType, Item, ItemPropertiesType, Shield } from "@speed-dungeon/common";

export const DEFAULT_MATERIAL_COLORS: { [name: string]: Color3 } = {
  Main: new Color3(0.792, 0.761, 0.694),
  Alternate: new Color3(0.259, 0.208, 0.18),
  Accent1: new Color3(0.482, 0.486, 0.467),
  Accent2: new Color3(0.278, 0.518, 0.447),
  Handle: new Color3(0.169, 0.145, 0.11),
  Hilt: new Color3(0.2, 0.204, 0.204),
  Blade: new Color3(0.6, 0.6, 0.55),
};

export type SavedMaterials = {
  default: { [materialName: string]: StandardMaterial };
  wood: { [materialName: string]: StandardMaterial };
  metal: { [materialName: string]: StandardMaterial };
};

export function createDefaultMaterials() {
  const toReturn: SavedMaterials = { default: {}, wood: {}, metal: {} };
  for (const [name, color] of Object.entries(DEFAULT_MATERIAL_COLORS)) {
    const material = new StandardMaterial(name);
    material.diffuseColor = color;
    material.roughness = 1;
    toReturn.default[name] = material;
  }
  for (const [name, color] of Object.entries(WOOD_COLORS)) {
    const material = new StandardMaterial(name);
    material.diffuseColor = color;
    material.roughness = 1;
    toReturn.wood[name] = material;
  }
  for (const [name, color] of Object.entries(METAL_COLORS)) {
    const material = new StandardMaterial(name);
    material.diffuseColor = color;
    material.roughness = 1;
    toReturn.metal[name] = material;
  }

  return toReturn;
}

export default function setDefaultMaterials(world: GameWorld, model: ISceneLoaderAsyncResult) {
  for (const [name, color] of Object.entries(DEFAULT_MATERIAL_COLORS)) {
    for (const mesh of model.meshes) {
      if (mesh.material?.name === name) {
        const materialOption = world.defaultMaterials.default[name];
        if (materialOption) mesh.material = materialOption;
      }
    }
  }
}

export const WOOD_COLORS = {
  lightest: new Color3(0.722, 0.612, 0.463),
  lighter: new Color3(0.447, 0.365, 0.282),
  medium: new Color3(0.435, 0.314, 0.235),
  darker: new Color3(0.294, 0.224, 0.176),
  darkest: new Color3(0.125, 0.106, 0.086),
  rose: new Color3(0.557, 0.365, 0.318),
};

export const METAL_COLORS = {
  lightest: new Color3(0.71, 0.694, 0.682),
  lighter: new Color3(0.588, 0.553, 0.553),
  medium: new Color3(0.306, 0.298, 0.306),
  darker: new Color3(0.125, 0.129, 0.133),
  darkest: new Color3(0.114, 0.118, 0.114),
  brass: new Color3(0.518, 0.369, 0.227),
};

export const MATERIAL_NAMES = {
  MAIN: "Main",
  ALTERNATE: "Alternate",
  ACCENT_1: "Accent1",
  ACCENT_2: "Accent2",
  HANDLE: "Handle",
  HILT: "Hilt",
  BLADE: "Blade",
};

export function assignEquipmentMaterials(
  gameWorld: GameWorld,
  item: Item,
  itemModel: ISceneLoaderAsyncResult
) {
  switch (item.itemProperties.type) {
    case ItemPropertiesType.Consumable:
      break;
    case ItemPropertiesType.Equipment:
      switch (item.itemProperties.equipmentProperties.equipmentBaseItemProperties.type) {
        case EquipmentType.Shield:
          switch (item.itemProperties.equipmentProperties.equipmentBaseItemProperties.baseItem) {
            case Shield.MakeshiftBuckler:
              for (const mesh of itemModel.meshes) {
                if (mesh.material?.name === MATERIAL_NAMES.MAIN)
                  mesh.material = gameWorld.defaultMaterials.wood["darker"]!;
                if (mesh.material?.name === MATERIAL_NAMES.ALTERNATE)
                  mesh.material = gameWorld.defaultMaterials.wood["medium"]!;
                if (mesh.material?.name === MATERIAL_NAMES.ACCENT_1)
                  mesh.material = gameWorld.defaultMaterials.metal["brass"]!;
                if (mesh.material?.name === MATERIAL_NAMES.ACCENT_2)
                  mesh.material = gameWorld.defaultMaterials.wood["darkest"]!;
              }
              break;
            case Shield.WoodenKiteShield:
              for (const mesh of itemModel.meshes) {
                if (mesh.material?.name === MATERIAL_NAMES.MAIN)
                  mesh.material = gameWorld.defaultMaterials.wood["lightest"]!;
                if (mesh.material?.name === MATERIAL_NAMES.ALTERNATE)
                  mesh.material = gameWorld.defaultMaterials.wood["lighter"]!;
                if (mesh.material?.name === MATERIAL_NAMES.ACCENT_1)
                  mesh.material = gameWorld.defaultMaterials.metal["medium"]!;
                if (mesh.material?.name === MATERIAL_NAMES.ACCENT_2)
                  mesh.material = gameWorld.defaultMaterials.wood["medium"]!;
              }
              break;
            case Shield.Buckler:
            case Shield.Pavise:
            case Shield.Aspis:
            case Shield.LanternShield:
            case Shield.KiteShield:
            case Shield.TowerShield:
            case Shield.AncientBuckler:
            case Shield.GothicShield:
          }
      }
  }
}
