import { Color3, ISceneLoaderAsyncResult, StandardMaterial } from "@babylonjs/core";
import { GameWorld } from ".";
import {
  EquipmentType,
  Item,
  ItemPropertiesType,
  MagicalElement,
  Shield,
  iterateNumericEnum,
} from "@speed-dungeon/common";

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
  wood: Record<LightestToDarkest, StandardMaterial>;
  metal: Record<LightestToDarkest, StandardMaterial>;
  accent: Record<AccentColor, StandardMaterial>;
};

export function createDefaultMaterials() {
  const toReturn: {
    default: { [materialName: string]: StandardMaterial };
    wood: Partial<Record<LightestToDarkest, StandardMaterial>>;
    metal: Partial<Record<LightestToDarkest, StandardMaterial>>;
    accent: Partial<Record<AccentColor, StandardMaterial>>;
  } = { default: {}, wood: {}, metal: {}, accent: {} };
  for (const [name, color] of Object.entries(DEFAULT_MATERIAL_COLORS)) {
    const material = new StandardMaterial(name);
    material.diffuseColor = color;
    material.roughness = 255;
    material.specularColor = color;
    toReturn.default[name] = material;
  }
  for (const name of iterateNumericEnum(LightestToDarkest)) {
    const color = WOOD_COLORS[name];
    const material = new StandardMaterial(formatLightestToDarkest(name) + "-wood");
    material.diffuseColor = color;
    material.roughness = 255;
    material.specularColor = color;
    toReturn.wood[name] = material;
  }
  for (const name of iterateNumericEnum(LightestToDarkest)) {
    const color = METAL_COLORS[name];
    const material = new StandardMaterial(formatLightestToDarkest(name) + "-metal");
    material.diffuseColor = color;
    material.roughness = 255;
    material.specularColor = color;
    toReturn.metal[name] = material;
  }
  for (const name of iterateNumericEnum(AccentColor)) {
    const color = ACCENT_COLORS[name];
    const material = new StandardMaterial(name + "-accent");
    material.diffuseColor = color;
    material.roughness = 255;
    material.specularColor = color;
    toReturn.accent[name] = material;
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

export enum LightestToDarkest {
  Lightest,
  Lighter,
  Medium,
  Darker,
  Darkest,
}
export function formatLightestToDarkest(enumMember: LightestToDarkest) {
  switch (enumMember) {
    case LightestToDarkest.Lightest:
      return "Lightest";
    case LightestToDarkest.Lighter:
      return "Lighter";
    case LightestToDarkest.Medium:
      return "Medium";
    case LightestToDarkest.Darker:
      return "Darker";
    case LightestToDarkest.Darkest:
      return "Darkest";
  }
}

export const WOOD_COLORS: Record<LightestToDarkest, Color3> = {
  [LightestToDarkest.Lightest]: new Color3(0.722, 0.612, 0.463),
  [LightestToDarkest.Lighter]: new Color3(0.447, 0.365, 0.282),
  [LightestToDarkest.Medium]: new Color3(0.435, 0.314, 0.235),
  [LightestToDarkest.Darker]: new Color3(0.294, 0.224, 0.176),
  [LightestToDarkest.Darkest]: new Color3(0.125, 0.106, 0.086),
};

export const METAL_COLORS: Record<LightestToDarkest, Color3> = {
  [LightestToDarkest.Lightest]: new Color3(0.71, 0.694, 0.682),
  [LightestToDarkest.Lighter]: new Color3(0.588, 0.553, 0.553),
  [LightestToDarkest.Medium]: new Color3(0.306, 0.298, 0.306),
  [LightestToDarkest.Darker]: new Color3(0.125, 0.129, 0.133),
  [LightestToDarkest.Darkest]: new Color3(0.114, 0.118, 0.114),
};

export enum AccentColor {
  Rose,
  Brass,
  Cherry,
  BurntOrange,
  KellyGreen,
}

export const ACCENT_COLORS: Record<AccentColor, Color3> = {
  [AccentColor.Rose]: new Color3(0.557, 0.365, 0.318),
  [AccentColor.Brass]: new Color3(0.518, 0.369, 0.227),
  [AccentColor.Cherry]: new Color3(0.643, 0.278, 0.298),
  [AccentColor.BurntOrange]: new Color3(0.616, 0.404, 0.247),
  [AccentColor.KellyGreen]: new Color3(0.361, 0.608, 0.494),
};

export const ELEMENT_COLORS: Record<MagicalElement, Color3> = {
  [MagicalElement.Fire]: new Color3(0.678, 0.145, 0.184),
  [MagicalElement.Ice]: new Color3(0.169, 0.592, 0.6),
  [MagicalElement.Lightning]: new Color3(0.439, 0.235, 0.569),
  [MagicalElement.Water]: new Color3(0.2, 0.18, 0.573),
  [MagicalElement.Earth]: new Color3(0.686, 0.663, 0.082),
  [MagicalElement.Wind]: new Color3(0.184, 0.667, 0.212),
  [MagicalElement.Dark]: new Color3(0.18, 0.145, 0.078),
  [MagicalElement.Light]: new Color3(0.655, 0.627, 0.553),
};

export const MATERIAL_NAMES = {
  MAIN: "Main",
  ALTERNATE: "Alternate",
  ACCENT_1: "Accent1",
  ACCENT_2: "Accent2",
  ACCENT_3: "Accent3",
  HANDLE: "Handle",
  HILT: "Hilt",
  BLADE: "Blade",
};

export function assignEquipmentMaterials(
  gameWorld: GameWorld,
  item: Item,
  itemModel: ISceneLoaderAsyncResult
) {
  let materialsByName = {};
  if (item.itemProperties.type === ItemPropertiesType.Consumable) return;

  switch (item.itemProperties.equipmentProperties.equipmentBaseItemProperties.type) {
    case EquipmentType.Shield:
      switch (item.itemProperties.equipmentProperties.equipmentBaseItemProperties.baseItem) {
        case Shield.MakeshiftBuckler:
          materialsByName = {
            [MATERIAL_NAMES.MAIN]: gameWorld.defaultMaterials.wood[LightestToDarkest.Darker],
            [MATERIAL_NAMES.ALTERNATE]: gameWorld.defaultMaterials.wood[LightestToDarkest.Medium],
            [MATERIAL_NAMES.ACCENT_1]: gameWorld.defaultMaterials.accent[AccentColor.Brass],
            [MATERIAL_NAMES.ACCENT_2]: gameWorld.defaultMaterials.wood[LightestToDarkest.Darkest],
          };
          break;
        case Shield.WoodenKiteShield:
          materialsByName = {
            [MATERIAL_NAMES.MAIN]: gameWorld.defaultMaterials.wood[LightestToDarkest.Lightest],
            [MATERIAL_NAMES.ALTERNATE]: gameWorld.defaultMaterials.wood[LightestToDarkest.Lighter],
            [MATERIAL_NAMES.ACCENT_1]: gameWorld.defaultMaterials.metal[LightestToDarkest.Medium],
            [MATERIAL_NAMES.ACCENT_2]: gameWorld.defaultMaterials.wood[LightestToDarkest.Medium],
          };
          break;
        case Shield.Buckler:
          materialsByName = {
            [MATERIAL_NAMES.MAIN]: gameWorld.defaultMaterials.metal[LightestToDarkest.Darker],
            [MATERIAL_NAMES.ALTERNATE]: gameWorld.defaultMaterials.metal[LightestToDarkest.Medium],
          };
          break;
        case Shield.Pavise:
          materialsByName = {
            [MATERIAL_NAMES.MAIN]: gameWorld.defaultMaterials.wood[LightestToDarkest.Lightest],
            [MATERIAL_NAMES.ALTERNATE]: gameWorld.defaultMaterials.accent[AccentColor.BurntOrange],
            [MATERIAL_NAMES.ACCENT_1]: gameWorld.defaultMaterials.accent[AccentColor.Cherry],
          };
          break;
        case Shield.Aspis:
          materialsByName = {
            [MATERIAL_NAMES.MAIN]: gameWorld.defaultMaterials.metal[LightestToDarkest.Medium],
            [MATERIAL_NAMES.ALTERNATE]: gameWorld.defaultMaterials.accent[AccentColor.Cherry],
            [MATERIAL_NAMES.ACCENT_1]: gameWorld.defaultMaterials.accent[AccentColor.Cherry],
            [MATERIAL_NAMES.ACCENT_2]: gameWorld.defaultMaterials.accent[AccentColor.BurntOrange],
            [MATERIAL_NAMES.ACCENT_3]: gameWorld.defaultMaterials.accent[AccentColor.KellyGreen],
          };
          break;
        case Shield.LanternShield:
          materialsByName = {
            [MATERIAL_NAMES.MAIN]: gameWorld.defaultMaterials.metal[LightestToDarkest.Medium],
            [MATERIAL_NAMES.BLADE]: gameWorld.defaultMaterials.metal[LightestToDarkest.Lighter],
            [MATERIAL_NAMES.ALTERNATE]: gameWorld.defaultMaterials.accent[AccentColor.Brass],
          };
          break;
        case Shield.KiteShield:
          materialsByName = {
            [MATERIAL_NAMES.MAIN]: gameWorld.defaultMaterials.metal[LightestToDarkest.Lighter],
            [MATERIAL_NAMES.ALTERNATE]: gameWorld.defaultMaterials.metal[LightestToDarkest.Medium],
          };
          break;
        case Shield.TowerShield:
          materialsByName = {
            [MATERIAL_NAMES.MAIN]: gameWorld.defaultMaterials.metal[LightestToDarkest.Lighter],
            [MATERIAL_NAMES.ALTERNATE]: gameWorld.defaultMaterials.metal[LightestToDarkest.Medium],
            [MATERIAL_NAMES.ACCENT_1]: gameWorld.defaultMaterials.accent[AccentColor.Brass],
          };
          break;
        case Shield.AncientBuckler:
        case Shield.GothicShield:
      }
  }
  applyMaterialsToModelMeshes(itemModel, materialsByName);
}

function applyMaterialsToModelMeshes(
  model: ISceneLoaderAsyncResult,
  materialNamesToMaterials: { [materialName: string]: StandardMaterial }
) {
  for (const mesh of model.meshes) {
    for (const [materialName, material] of Object.entries(materialNamesToMaterials))
      if (mesh.material?.name === materialName) mesh.material = material;
  }
}
