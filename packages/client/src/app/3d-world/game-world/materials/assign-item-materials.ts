import {
  ConsumableType,
  EquipmentType,
  HpChangeSource,
  Item,
  ItemPropertiesType,
  MagicalElement,
  OneHandedMeleeWeapon,
  Shield,
  TwoHandedMeleeWeapon,
  TwoHandedRangedWeapon,
  formatMagicalElement,
} from "@speed-dungeon/common";
import { ISceneLoaderAsyncResult, Scene, StandardMaterial } from "@babylonjs/core";
import {
  AccentColor,
  CustomMaterial,
  ELEMENT_COLORS,
  LightestToDarkest,
  MATERIAL_NAMES,
  PlasticColor,
} from "./material-colors";
import applyMaterialsToModelMeshes from "./apply-materials-to-model-meshes";
import { desaturate } from "./utils";
import { DYNAMIC_MATERIAL_TAG, SavedMaterials } from "./create-default-materials";

export function assignConsumableMaterials(
  item: Item,
  itemModel: ISceneLoaderAsyncResult,
  savedMaterials: SavedMaterials,
  _scene: Scene
) {
  let materials: { [name: string]: StandardMaterial } = {};

  if (item.itemProperties.type !== ItemPropertiesType.Consumable)
    return console.error("passed equipment to consumable materials function");
  switch (item.itemProperties.consumableProperties.consumableType) {
    case ConsumableType.HpAutoinjector:
      materials[MATERIAL_NAMES.ACCENT_1] = savedMaterials.accent[AccentColor.HPGreen];
      materials[MATERIAL_NAMES.ACCENT_2] = savedMaterials.plastic[PlasticColor.Blue];
      materials[MATERIAL_NAMES.ACCENT_3] = savedMaterials.plastic[PlasticColor.Yellow];
      materials[MATERIAL_NAMES.MAIN] = savedMaterials.plastic[PlasticColor.White];
      materials[MATERIAL_NAMES.ALTERNATE] = savedMaterials.plastic[PlasticColor.Orange];
      break;
    case ConsumableType.MpAutoinjector:
      materials[MATERIAL_NAMES.ACCENT_1] = savedMaterials.accent[AccentColor.MPBlue];
      materials[MATERIAL_NAMES.ACCENT_2] = savedMaterials.plastic[PlasticColor.Blue];
      materials[MATERIAL_NAMES.ACCENT_3] = savedMaterials.plastic[PlasticColor.Yellow];
      materials[MATERIAL_NAMES.MAIN] = savedMaterials.plastic[PlasticColor.White];
      materials[MATERIAL_NAMES.ALTERNATE] = savedMaterials.plastic[PlasticColor.Orange];
      break;
  }

  applyMaterialsToModelMeshes(itemModel, materials);
}

export function assignEquipmentMaterials(
  item: Item,
  itemModel: ISceneLoaderAsyncResult,
  savedMaterials: SavedMaterials,
  scene: Scene
) {
  let materials: { [name: string]: StandardMaterial } = {};
  if (item.itemProperties.type === ItemPropertiesType.Consumable)
    return console.error("passed consumable to equipment materials function");

  const { equipmentBaseItemProperties } = item.itemProperties.equipmentProperties;

  materials[MATERIAL_NAMES.BLADE] = savedMaterials.metal[LightestToDarkest.Lighter];
  materials[MATERIAL_NAMES.ACCENT_1] = savedMaterials.metal[LightestToDarkest.Lightest];

  switch (equipmentBaseItemProperties.type) {
    case EquipmentType.OneHandedMeleeWeapon:
      switch (equipmentBaseItemProperties.baseItem) {
        case OneHandedMeleeWeapon.Stick:
          materials[MATERIAL_NAMES.HANDLE] = savedMaterials.wood[LightestToDarkest.Lighter];
          break;
        case OneHandedMeleeWeapon.Club:
          materials[MATERIAL_NAMES.HANDLE] = savedMaterials.wood[LightestToDarkest.Darker];
          materials[MATERIAL_NAMES.BLADE] = savedMaterials.metal[LightestToDarkest.Medium];
          break;
        case OneHandedMeleeWeapon.Mace:
          materials[MATERIAL_NAMES.HANDLE] = savedMaterials.wood[LightestToDarkest.Darker];
          break;
        case OneHandedMeleeWeapon.Morningstar:
          materials[MATERIAL_NAMES.HANDLE] = savedMaterials.wood[LightestToDarkest.Darkest];
          materials[MATERIAL_NAMES.BLADE] = savedMaterials.metal[LightestToDarkest.Darker];
          materials[MATERIAL_NAMES.ACCENT_1] = savedMaterials.metal[LightestToDarkest.Darker];
          break;
        case OneHandedMeleeWeapon.WarHammer:
          materials[MATERIAL_NAMES.HANDLE] = savedMaterials.wood[LightestToDarkest.Darker];
          materials[MATERIAL_NAMES.ACCENT_1] = savedMaterials.metal[LightestToDarkest.Darkest];
          materials[MATERIAL_NAMES.BLADE] = savedMaterials.metal[LightestToDarkest.Darkest];
          break;
        case OneHandedMeleeWeapon.ShortSword:
          materials[MATERIAL_NAMES.HANDLE] = savedMaterials.wood[LightestToDarkest.Medium];
          materials[MATERIAL_NAMES.HILT] = savedMaterials.metal[LightestToDarkest.Medium];
          break;
        case OneHandedMeleeWeapon.Blade:
          materials[MATERIAL_NAMES.HANDLE] = savedMaterials.wood[LightestToDarkest.Lighter];
          materials[MATERIAL_NAMES.HILT] = savedMaterials.metal[LightestToDarkest.Lightest];
          break;
        case OneHandedMeleeWeapon.BroadSword:
          materials[MATERIAL_NAMES.HANDLE] = savedMaterials.wood[LightestToDarkest.Darker];
          materials[MATERIAL_NAMES.HILT] = savedMaterials.metal[LightestToDarkest.Darker];
          materials[MATERIAL_NAMES.BLADE] = savedMaterials.metal[LightestToDarkest.Medium];
          break;
        case OneHandedMeleeWeapon.BastardSword:
          materials[MATERIAL_NAMES.HANDLE] = savedMaterials.wood[LightestToDarkest.Darker];
          materials[MATERIAL_NAMES.HILT] = savedMaterials.metal[LightestToDarkest.Darker];
          materials[MATERIAL_NAMES.BLADE] = savedMaterials.metal[LightestToDarkest.Darkest];
          break;
        case OneHandedMeleeWeapon.Dagger:
          materials[MATERIAL_NAMES.HANDLE] = savedMaterials.wood[LightestToDarkest.Lighter];
          materials[MATERIAL_NAMES.HILT] = savedMaterials.metal[LightestToDarkest.Medium];
          break;
        case OneHandedMeleeWeapon.Rapier:
          materials[MATERIAL_NAMES.HANDLE] = savedMaterials.wood[LightestToDarkest.Medium];
          materials[MATERIAL_NAMES.HILT] = savedMaterials.metal[LightestToDarkest.Medium];
          materials[MATERIAL_NAMES.ACCENT_1] = savedMaterials.accent[AccentColor.Brass];
          break;
        case OneHandedMeleeWeapon.ShortSpear:
          materials[MATERIAL_NAMES.HANDLE] = savedMaterials.wood[LightestToDarkest.Lighter];
          materials[MATERIAL_NAMES.ACCENT_2] = savedMaterials.accent[AccentColor.Rose];
          break;
        case OneHandedMeleeWeapon.RuneSword:
          let i = 1;
          for (const classification of equipmentBaseItemProperties.damageClassification) {
            if (classification.elementOption !== null) {
              const material = new StandardMaterial(
                DYNAMIC_MATERIAL_TAG + formatMagicalElement(classification.elementOption),
                scene
              );

              const color = desaturate(ELEMENT_COLORS[classification.elementOption], 0.25);
              material.diffuseColor = color;
              material.roughness = 0;
              materials["Accent" + i] = material;
            }
            i += 1;
          }
          materials[MATERIAL_NAMES.HANDLE] = savedMaterials.metal[LightestToDarkest.Medium];
          materials[MATERIAL_NAMES.HILT] = savedMaterials.metal[LightestToDarkest.Darker];
          break;
        case OneHandedMeleeWeapon.EtherBlade:
          materials[MATERIAL_NAMES.HANDLE] = savedMaterials.metal[LightestToDarkest.Medium];
          materials[MATERIAL_NAMES.HILT] = savedMaterials.metal[LightestToDarkest.Darker];
          materials[MATERIAL_NAMES.BLADE] = savedMaterials.custom[CustomMaterial.Ether];
          break;
        case OneHandedMeleeWeapon.IceBlade:
          materials[MATERIAL_NAMES.HANDLE] = savedMaterials.metal[LightestToDarkest.Medium];
          materials[MATERIAL_NAMES.HILT] = savedMaterials.metal[LightestToDarkest.Darker];
          materials[MATERIAL_NAMES.BLADE] = savedMaterials.custom[CustomMaterial.Ice];
          materials[MATERIAL_NAMES.ACCENT_2] = savedMaterials.metal[LightestToDarkest.Darker];
          break;
        case OneHandedMeleeWeapon.MapleWand:
          materials[MATERIAL_NAMES.HANDLE] = savedMaterials.wood[LightestToDarkest.Medium];
          materials[MATERIAL_NAMES.HILT] = savedMaterials.metal[LightestToDarkest.Darker];
          materials[MATERIAL_NAMES.MAIN] = savedMaterials.wood[LightestToDarkest.Darker];
          break;
        case OneHandedMeleeWeapon.WillowWand:
          materials[MATERIAL_NAMES.HANDLE] = savedMaterials.wood[LightestToDarkest.Medium];
          materials[MATERIAL_NAMES.ACCENT_1] = savedMaterials.accent[AccentColor.Brass];
          materials[MATERIAL_NAMES.MAIN] = savedMaterials.accent[AccentColor.CobaltBlue];
          break;
        case OneHandedMeleeWeapon.YewWand:
          materials[MATERIAL_NAMES.HANDLE] = savedMaterials.wood[LightestToDarkest.Darker];
          materials[MATERIAL_NAMES.ALTERNATE] = savedMaterials.accent[AccentColor.Brass];
          materials[MATERIAL_NAMES.ACCENT_1] = savedMaterials.custom[CustomMaterial.Ether];
          materials[MATERIAL_NAMES.MAIN] = savedMaterials.metal[LightestToDarkest.Darker];
          materials[MATERIAL_NAMES.HILT] = savedMaterials.accent[AccentColor.Brass];
          break;
        case OneHandedMeleeWeapon.RoseWand:
          materials[MATERIAL_NAMES.HANDLE] = savedMaterials.wood[LightestToDarkest.Darker];
          materials[MATERIAL_NAMES.MAIN] = savedMaterials.accent[AccentColor.Cherry];
          materials[MATERIAL_NAMES.ACCENT_1] = savedMaterials.accent[AccentColor.Rose];
      }
      break;
    case EquipmentType.TwoHandedMeleeWeapon:
      switch (equipmentBaseItemProperties.baseItem) {
        case TwoHandedMeleeWeapon.RottingBranch:
          materials[MATERIAL_NAMES.HANDLE] = savedMaterials.wood[LightestToDarkest.Medium];
          break;
        case TwoHandedMeleeWeapon.BoStaff:
          materials[MATERIAL_NAMES.HANDLE] = savedMaterials.wood[LightestToDarkest.Lighter];
          materials[MATERIAL_NAMES.HILT] = savedMaterials.wood[LightestToDarkest.Lighter];
          materials[MATERIAL_NAMES.ACCENT_2] = savedMaterials.wood[LightestToDarkest.Lighter];
          materials[MATERIAL_NAMES.ACCENT_1] = savedMaterials.wood[LightestToDarkest.Lighter];
          break;
        case TwoHandedMeleeWeapon.Spear:
          materials[MATERIAL_NAMES.HANDLE] = savedMaterials.wood[LightestToDarkest.Medium];
          break;
        case TwoHandedMeleeWeapon.Bardiche:
          materials[MATERIAL_NAMES.HANDLE] = savedMaterials.wood[LightestToDarkest.Medium];
          materials[MATERIAL_NAMES.HILT] = savedMaterials.metal[LightestToDarkest.Lighter];
          break;
        case TwoHandedMeleeWeapon.SplittingMaul:
          materials[MATERIAL_NAMES.HANDLE] = savedMaterials.wood[LightestToDarkest.Darker];
          materials[MATERIAL_NAMES.ACCENT_2] = savedMaterials.metal[LightestToDarkest.Darkest];
          break;
        case TwoHandedMeleeWeapon.Maul:
          materials[MATERIAL_NAMES.BLADE] = savedMaterials.metal[LightestToDarkest.Darker];
          materials[MATERIAL_NAMES.HANDLE] = savedMaterials.wood[LightestToDarkest.Darker];
          materials[MATERIAL_NAMES.ACCENT_1] = savedMaterials.accent[AccentColor.Brass];
          break;
        case TwoHandedMeleeWeapon.BattleAxe:
          materials[MATERIAL_NAMES.HANDLE] = savedMaterials.wood[LightestToDarkest.Medium];
          materials[MATERIAL_NAMES.ACCENT_2] = savedMaterials.wood[LightestToDarkest.Darker];
          break;
        case TwoHandedMeleeWeapon.Glaive:
          materials[MATERIAL_NAMES.HANDLE] = savedMaterials.wood[LightestToDarkest.Lighter];
          break;
        case TwoHandedMeleeWeapon.ElementalStaff:
          assignElementalMaterials(
            materials,
            savedMaterials,
            equipmentBaseItemProperties.damageClassification
          );
          materials[MATERIAL_NAMES.HANDLE] = savedMaterials.wood[LightestToDarkest.Lighter];
          materials[MATERIAL_NAMES.HILT] = savedMaterials.wood[LightestToDarkest.Lighter];
          break;
        case TwoHandedMeleeWeapon.Trident:
          materials[MATERIAL_NAMES.ACCENT_1] = savedMaterials.elements[MagicalElement.Water];
          // const tridentMaterial = new StandardMaterial(`trident${DYNAMIC_MATERIAL_TAG}`);
          // tridentMaterial.emissiveColor = ELEMENT_COLORS[MagicalElement.Water];
          // tridentMaterial.alpha = 0.1;
          // materials[MATERIAL_NAMES.ACCENT_2] = tridentMaterial;
          materials[MATERIAL_NAMES.BLADE] = savedMaterials.accent[AccentColor.Brass];
          materials[MATERIAL_NAMES.HILT] = savedMaterials.accent[AccentColor.Brass];
          materials[MATERIAL_NAMES.HANDLE] = savedMaterials.wood[LightestToDarkest.Medium];
          break;
        case TwoHandedMeleeWeapon.GreatAxe:
          materials[MATERIAL_NAMES.ALTERNATE] = savedMaterials.custom[CustomMaterial.AncientMetal];
          materials[MATERIAL_NAMES.ACCENT_2] = savedMaterials.metal[LightestToDarkest.Medium];
          materials[MATERIAL_NAMES.BLADE] = savedMaterials.accent[AccentColor.DarkBlue];
          materials[MATERIAL_NAMES.HILT] = savedMaterials.metal[LightestToDarkest.Darker];
          break;
        case TwoHandedMeleeWeapon.GravityHammer:
          materials[MATERIAL_NAMES.ACCENT_1] = savedMaterials.metal[LightestToDarkest.Darker];
          materials[MATERIAL_NAMES.ACCENT_2] = savedMaterials.custom[CustomMaterial.AncientMetal];
          materials[MATERIAL_NAMES.ALTERNATE] = savedMaterials.accent[AccentColor.CobaltBlue];
          materials[MATERIAL_NAMES.BLADE] = savedMaterials.accent[AccentColor.DarkBlue];
          materials[MATERIAL_NAMES.HANDLE] = savedMaterials.metal[LightestToDarkest.Medium];
          break;
        case TwoHandedMeleeWeapon.ElmStaff:
          materials[MATERIAL_NAMES.HANDLE] = savedMaterials.wood[LightestToDarkest.Darker];
          materials[MATERIAL_NAMES.ACCENT_1] = savedMaterials.accent[AccentColor.BurntOrange];
          break;
        case TwoHandedMeleeWeapon.MahoganyStaff:
          materials[MATERIAL_NAMES.HANDLE] = savedMaterials.wood[LightestToDarkest.Darker];
          materials[MATERIAL_NAMES.ACCENT_1] = savedMaterials.accent[AccentColor.Brass];
          materials[MATERIAL_NAMES.ALTERNATE] = savedMaterials.custom[CustomMaterial.Ice];
          break;
        case TwoHandedMeleeWeapon.EbonyStaff:
          materials[MATERIAL_NAMES.HANDLE] = savedMaterials.wood[LightestToDarkest.Darkest];
          materials[MATERIAL_NAMES.ALTERNATE] = savedMaterials.accent[AccentColor.Cherry];
          materials[MATERIAL_NAMES.ACCENT_1] = savedMaterials.wood[LightestToDarkest.Darker];
          break;
      }
      break;
    case EquipmentType.TwoHandedRangedWeapon:
      switch (equipmentBaseItemProperties.baseItem) {
        case TwoHandedRangedWeapon.ShortBow:
          materials[MATERIAL_NAMES.MAIN] = savedMaterials.wood[LightestToDarkest.Medium];
          materials[MATERIAL_NAMES.HANDLE] = savedMaterials.wood[LightestToDarkest.Lighter];
          materials[MATERIAL_NAMES.ACCENT_1] = savedMaterials.wood[LightestToDarkest.Lightest];
          break;
        case TwoHandedRangedWeapon.RecurveBow:
          materials[MATERIAL_NAMES.MAIN] = savedMaterials.wood[LightestToDarkest.Darker];
          materials[MATERIAL_NAMES.ACCENT_1] = savedMaterials.wood[LightestToDarkest.Lightest];
          break;
        case TwoHandedRangedWeapon.CompositeBow:
          materials[MATERIAL_NAMES.MAIN] = savedMaterials.metal[LightestToDarkest.Medium];
          materials[MATERIAL_NAMES.HANDLE] = savedMaterials.metal[LightestToDarkest.Darker];
          materials[MATERIAL_NAMES.ALTERNATE] = savedMaterials.wood[LightestToDarkest.Lightest];
          break;
        case TwoHandedRangedWeapon.MilitaryBow:
          materials[MATERIAL_NAMES.MAIN] = savedMaterials.accent[AccentColor.DarkBlue];
          materials[MATERIAL_NAMES.HANDLE] = savedMaterials.metal[LightestToDarkest.Darker];
          materials[MATERIAL_NAMES.ALTERNATE] = savedMaterials.wood[LightestToDarkest.Lightest];
          break;
        case TwoHandedRangedWeapon.EtherBow:
          materials[MATERIAL_NAMES.MAIN] = savedMaterials.wood[LightestToDarkest.Darker];
          materials[MATERIAL_NAMES.HANDLE] = savedMaterials.metal[LightestToDarkest.Darker];
          materials[MATERIAL_NAMES.ALTERNATE] = savedMaterials.custom[CustomMaterial.Ether];
          materials[MATERIAL_NAMES.ACCENT_1] = savedMaterials.custom[CustomMaterial.Ether];
          materials[MATERIAL_NAMES.ACCENT_2] = savedMaterials.metal[LightestToDarkest.Darker];
          break;
      }
      break;
    case EquipmentType.Shield:
      switch (equipmentBaseItemProperties.baseItem) {
        case Shield.MakeshiftBuckler:
          materials = {
            [MATERIAL_NAMES.MAIN]: savedMaterials.wood[LightestToDarkest.Darker],
            [MATERIAL_NAMES.ALTERNATE]: savedMaterials.wood[LightestToDarkest.Medium],
            [MATERIAL_NAMES.ACCENT_1]: savedMaterials.accent[AccentColor.Brass],
            [MATERIAL_NAMES.ACCENT_2]: savedMaterials.wood[LightestToDarkest.Darkest],
          };
          break;
        case Shield.Heater:
          materials = {
            [MATERIAL_NAMES.MAIN]: savedMaterials.wood[LightestToDarkest.Lightest],
            [MATERIAL_NAMES.ALTERNATE]: savedMaterials.wood[LightestToDarkest.Lighter],
            [MATERIAL_NAMES.ACCENT_1]: savedMaterials.metal[LightestToDarkest.Medium],
            [MATERIAL_NAMES.ACCENT_2]: savedMaterials.wood[LightestToDarkest.Medium],
          };
          break;
        case Shield.Buckler:
          materials = {
            [MATERIAL_NAMES.MAIN]: savedMaterials.metal[LightestToDarkest.Darker],
            [MATERIAL_NAMES.ALTERNATE]: savedMaterials.metal[LightestToDarkest.Medium],
          };
          break;
        case Shield.Pavise:
          materials = {
            [MATERIAL_NAMES.MAIN]: savedMaterials.wood[LightestToDarkest.Lightest],
            [MATERIAL_NAMES.ALTERNATE]: savedMaterials.accent[AccentColor.BurntOrange],
            [MATERIAL_NAMES.ACCENT_1]: savedMaterials.accent[AccentColor.Cherry],
          };
          break;
        case Shield.Aspis:
          materials = {
            [MATERIAL_NAMES.MAIN]: savedMaterials.metal[LightestToDarkest.Medium],
            [MATERIAL_NAMES.ALTERNATE]: savedMaterials.accent[AccentColor.Cherry],
            [MATERIAL_NAMES.ACCENT_1]: savedMaterials.accent[AccentColor.Cherry],
            [MATERIAL_NAMES.ACCENT_2]: savedMaterials.accent[AccentColor.BurntOrange],
            [MATERIAL_NAMES.ACCENT_3]: savedMaterials.accent[AccentColor.KellyGreen],
          };
          break;
        case Shield.LanternShield:
          materials = {
            [MATERIAL_NAMES.MAIN]: savedMaterials.metal[LightestToDarkest.Medium],
            [MATERIAL_NAMES.BLADE]: savedMaterials.metal[LightestToDarkest.Lighter],
            [MATERIAL_NAMES.ALTERNATE]: savedMaterials.accent[AccentColor.Brass],
          };
          break;
        case Shield.KiteShield:
          materials = {
            [MATERIAL_NAMES.MAIN]: savedMaterials.metal[LightestToDarkest.Lighter],
            [MATERIAL_NAMES.ALTERNATE]: savedMaterials.metal[LightestToDarkest.Medium],
          };
          break;
        case Shield.TowerShield:
          materials = {
            [MATERIAL_NAMES.MAIN]: savedMaterials.wood[LightestToDarkest.Medium],
            [MATERIAL_NAMES.ALTERNATE]: savedMaterials.metal[LightestToDarkest.Medium],
            [MATERIAL_NAMES.ACCENT_1]: savedMaterials.accent[AccentColor.Brass],
          };
          break;
        case Shield.AncientBuckler:
          materials = {
            [MATERIAL_NAMES.MAIN]: savedMaterials.accent[AccentColor.DarkBlue],
            [MATERIAL_NAMES.ALTERNATE]: savedMaterials.accent[AccentColor.CobaltBlue],
            [MATERIAL_NAMES.ACCENT_1]: savedMaterials.metal[LightestToDarkest.Medium],
            [MATERIAL_NAMES.ACCENT_2]: savedMaterials.metal[LightestToDarkest.Lighter],
            [MATERIAL_NAMES.ACCENT_3]: savedMaterials.custom[CustomMaterial.AncientMetal],
          };
          break;
        case Shield.GothicShield:
          materials = {
            [MATERIAL_NAMES.MAIN]: savedMaterials.accent[AccentColor.DarkBlue],
            [MATERIAL_NAMES.ALTERNATE]: savedMaterials.metal[LightestToDarkest.Medium],
            [MATERIAL_NAMES.ACCENT_1]: savedMaterials.metal[LightestToDarkest.Lighter],
          };
          break;
      }
  }
  applyMaterialsToModelMeshes(itemModel, materials);
}

function assignElementalMaterials(
  materials: { [name: string]: StandardMaterial },
  savedMaterials: SavedMaterials,
  damageClassification: HpChangeSource[]
) {
  let i = 1;
  for (const classification of damageClassification) {
    if (classification.elementOption !== null) {
      const material = savedMaterials.elements[classification.elementOption];
      materials["Accent" + i] = material;
    }
    i += 1;
  }
}
