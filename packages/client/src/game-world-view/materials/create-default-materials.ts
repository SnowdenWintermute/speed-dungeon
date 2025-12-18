import { Color3, Scene, StandardMaterial } from "@babylonjs/core";
import {
  ACCENT_COLORS,
  AccentColor,
  CustomMaterial,
  DEFAULT_MATERIAL_COLORS,
  ELEMENT_COLORS,
  LightestToDarkest,
  METAL_COLORS,
  PLASTIC_COLORS,
  PlasticColor,
  WOOD_COLORS,
  formatLightestToDarkest,
} from "./material-colors";
import { MagicalElement, iterateNumericEnum } from "@speed-dungeon/common";

export const DYNAMIC_MATERIAL_TAG = "-dynamic-material";

export type SavedMaterials = {
  default: { [materialName: string]: StandardMaterial };
  wood: Record<LightestToDarkest, StandardMaterial>;
  metal: Record<LightestToDarkest, StandardMaterial>;
  accent: Record<AccentColor, StandardMaterial>;
  elements: Record<MagicalElement, StandardMaterial>;
  custom: Record<CustomMaterial, StandardMaterial>;
  plastic: Record<PlasticColor, StandardMaterial>;
};

export function createDefaultMaterials(scene: Scene): SavedMaterials {
  const toReturn: {
    default: { [materialName: string]: StandardMaterial };
    wood: Partial<Record<LightestToDarkest, StandardMaterial>>;
    metal: Partial<Record<LightestToDarkest, StandardMaterial>>;
    accent: Partial<Record<AccentColor, StandardMaterial>>;
    elements: Partial<Record<MagicalElement, StandardMaterial>>;
    custom: Partial<Record<CustomMaterial, StandardMaterial>>;
    plastic: Partial<Record<PlasticColor, StandardMaterial>>;
  } = { default: {}, wood: {}, metal: {}, plastic: {}, accent: {}, elements: {}, custom: {} };
  // CUSTOM
  const etherMaterial = new StandardMaterial("ether", scene);
  etherMaterial.diffuseColor = new Color3(0.486, 0.286, 0.878);
  etherMaterial.alpha = 0.4;
  etherMaterial.emissiveColor = new Color3(0.486, 0.286, 0.878);
  toReturn.custom[CustomMaterial.Ether] = etherMaterial;

  const iceMaterial = new StandardMaterial("ice", scene);
  iceMaterial.diffuseColor = ELEMENT_COLORS[MagicalElement.Ice];
  iceMaterial.alpha = 0.6;
  toReturn.custom[CustomMaterial.Ice] = iceMaterial;

  const ancientMetal = new StandardMaterial("ancient-metal", scene);
  ancientMetal.emissiveColor = new Color3(0.094, 0.839, 0.812);
  toReturn.custom[CustomMaterial.AncientMetal] = ancientMetal;

  //
  for (const [name, color] of Object.entries(DEFAULT_MATERIAL_COLORS)) {
    const material = new StandardMaterial(name, scene);
    material.diffuseColor = color;
    material.roughness = 255;
    material.specularColor = color;
    toReturn.default[name] = material;
  }
  for (const name of iterateNumericEnum(LightestToDarkest)) {
    const color = WOOD_COLORS[name];
    const material = new StandardMaterial(formatLightestToDarkest(name) + "-wood", scene);
    material.diffuseColor = color;
    material.roughness = 255;
    material.specularColor = color;
    toReturn.wood[name] = material;
  }
  for (const name of iterateNumericEnum(LightestToDarkest)) {
    const color = METAL_COLORS[name];
    const material = new StandardMaterial(formatLightestToDarkest(name) + "-metal", scene);
    material.diffuseColor = color;
    material.roughness = 1;
    material.specularColor = color;
    toReturn.metal[name] = material;
  }
  for (const name of iterateNumericEnum(PlasticColor)) {
    const color = PLASTIC_COLORS[name];
    const material = new StandardMaterial(name + "-plastic", scene);
    material.diffuseColor = color;
    material.roughness = 3;
    material.specularColor = color;
    toReturn.plastic[name] = material;
  }
  for (const name of iterateNumericEnum(AccentColor)) {
    const color = ACCENT_COLORS[name];
    const material = new StandardMaterial(name + "-accent", scene);
    material.diffuseColor = color;
    material.roughness = 255;
    material.specularColor = color;
    toReturn.accent[name] = material;
  }
  for (const name of iterateNumericEnum(MagicalElement)) {
    const color = ELEMENT_COLORS[name];
    const material = new StandardMaterial(name + "-element", scene);
    material.diffuseColor = color;
    material.roughness = 255;
    material.specularColor = color;
    toReturn.elements[name] = material;
  }

  return toReturn as SavedMaterials;
}
