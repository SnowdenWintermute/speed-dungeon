import { Color3, StandardMaterial } from "@babylonjs/core";
import {
  ACCENT_COLORS,
  AccentColor,
  CustomMaterial,
  DEFAULT_MATERIAL_COLORS,
  ELEMENT_COLORS,
  LightestToDarkest,
  METAL_COLORS,
  WOOD_COLORS,
  formatLightestToDarkest,
} from "./material-colors";
import { MagicalElement, iterateNumericEnum } from "@speed-dungeon/common";

export type SavedMaterials = {
  default: { [materialName: string]: StandardMaterial };
  wood: Record<LightestToDarkest, StandardMaterial>;
  metal: Record<LightestToDarkest, StandardMaterial>;
  accent: Record<AccentColor, StandardMaterial>;
  elements: Record<MagicalElement, StandardMaterial>;
  custom: Record<CustomMaterial, StandardMaterial>;
};

export function createDefaultMaterials(): SavedMaterials {
  const toReturn: {
    default: { [materialName: string]: StandardMaterial };
    wood: Partial<Record<LightestToDarkest, StandardMaterial>>;
    metal: Partial<Record<LightestToDarkest, StandardMaterial>>;
    accent: Partial<Record<AccentColor, StandardMaterial>>;
    elements: Partial<Record<MagicalElement, StandardMaterial>>;
    custom: Partial<Record<CustomMaterial, StandardMaterial>>;
  } = { default: {}, wood: {}, metal: {}, accent: {}, elements: {}, custom: {} };
  // CUSTOM
  const etherMaterial = new StandardMaterial("ether");
  etherMaterial.diffuseColor = new Color3(0.486, 0.286, 0.878);
  etherMaterial.alpha = 0.4;
  etherMaterial.emissiveColor = new Color3(0.486, 0.286, 0.878);
  toReturn.custom[CustomMaterial.Ether] = etherMaterial;

  const iceMaterial = new StandardMaterial("ice");
  iceMaterial.diffuseColor = ELEMENT_COLORS[MagicalElement.Ice];
  iceMaterial.alpha = 0.6;
  toReturn.custom[CustomMaterial.Ice] = iceMaterial;

  const ancientMetal = new StandardMaterial("ancient-metal");
  ancientMetal.emissiveColor = new Color3(0.094, 0.839, 0.812);
  toReturn.custom[CustomMaterial.AncientMetal] = ancientMetal;

  //
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
  for (const name of iterateNumericEnum(MagicalElement)) {
    const color = ELEMENT_COLORS[name];
    const material = new StandardMaterial(name + "-element");
    material.diffuseColor = color;
    material.roughness = 255;
    material.specularColor = color;
    toReturn.elements[name] = material;
  }

  return toReturn as SavedMaterials;
}
