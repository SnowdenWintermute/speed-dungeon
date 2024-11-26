import {
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
import { GameWorld } from "..";
import { Color3, ISceneLoaderAsyncResult, Material, StandardMaterial } from "@babylonjs/core";
import {
  AccentColor,
  CustomMaterial,
  ELEMENT_COLORS,
  LightestToDarkest,
  MATERIAL_NAMES,
} from "./material-colors";
import applyMaterialsToModelMeshes from "./apply-materials-to-model-meshes";
import { desaturate, lighten } from "./utils";
import cloneDeep from "lodash.clonedeep";
import { DYNAMIC_MATERIAL_TAG } from "./create-default-materials";

export function assignEquipmentMaterials(
  gameWorld: GameWorld,
  item: Item,
  itemModel: ISceneLoaderAsyncResult
) {
  let materials: { [name: string]: StandardMaterial } = {};
  if (item.itemProperties.type === ItemPropertiesType.Consumable) return;
  const { equipmentBaseItemProperties } = item.itemProperties.equipmentProperties;
  const { defaultMaterials } = gameWorld;

  switch (equipmentBaseItemProperties.type) {
    case EquipmentType.OneHandedMeleeWeapon:
      materials[MATERIAL_NAMES.BLADE] = defaultMaterials.metal[LightestToDarkest.Lighter];
      materials[MATERIAL_NAMES.ACCENT_1] = defaultMaterials.metal[LightestToDarkest.Lightest];
      switch (equipmentBaseItemProperties.baseItem) {
        case OneHandedMeleeWeapon.Stick:
          materials[MATERIAL_NAMES.HANDLE] = defaultMaterials.wood[LightestToDarkest.Lighter];
          break;
        case OneHandedMeleeWeapon.Mace:
          materials[MATERIAL_NAMES.HANDLE] = defaultMaterials.wood[LightestToDarkest.Darker];
          break;
        case OneHandedMeleeWeapon.Morningstar:
          materials[MATERIAL_NAMES.HANDLE] = defaultMaterials.wood[LightestToDarkest.Darkest];
          materials[MATERIAL_NAMES.BLADE] = defaultMaterials.metal[LightestToDarkest.Darker];
          materials[MATERIAL_NAMES.HILT] = defaultMaterials.metal[LightestToDarkest.Darker];
          break;
        case OneHandedMeleeWeapon.WarHammer:
          materials[MATERIAL_NAMES.HANDLE] = defaultMaterials.wood[LightestToDarkest.Darker];
          materials[MATERIAL_NAMES.BLADE] = defaultMaterials.metal[LightestToDarkest.Darkest];
          break;
        case OneHandedMeleeWeapon.ShortSword:
          materials[MATERIAL_NAMES.HANDLE] = defaultMaterials.wood[LightestToDarkest.Medium];
          materials[MATERIAL_NAMES.HILT] = defaultMaterials.metal[LightestToDarkest.Medium];
          break;
        case OneHandedMeleeWeapon.Blade:
          materials[MATERIAL_NAMES.HANDLE] = defaultMaterials.wood[LightestToDarkest.Lighter];
          materials[MATERIAL_NAMES.HILT] = defaultMaterials.metal[LightestToDarkest.Lightest];
          break;
        case OneHandedMeleeWeapon.BroadSword:
          materials[MATERIAL_NAMES.HANDLE] = defaultMaterials.wood[LightestToDarkest.Darker];
          materials[MATERIAL_NAMES.HILT] = defaultMaterials.metal[LightestToDarkest.Darker];
          materials[MATERIAL_NAMES.BLADE] = defaultMaterials.metal[LightestToDarkest.Medium];
          break;
        case OneHandedMeleeWeapon.BastardSword:
          materials[MATERIAL_NAMES.HANDLE] = defaultMaterials.wood[LightestToDarkest.Darker];
          materials[MATERIAL_NAMES.HILT] = defaultMaterials.metal[LightestToDarkest.Darker];
          materials[MATERIAL_NAMES.BLADE] = defaultMaterials.metal[LightestToDarkest.Darkest];
          break;
        case OneHandedMeleeWeapon.Dagger:
          materials[MATERIAL_NAMES.HANDLE] = defaultMaterials.wood[LightestToDarkest.Lighter];
          materials[MATERIAL_NAMES.HILT] = defaultMaterials.metal[LightestToDarkest.Medium];
          break;
        case OneHandedMeleeWeapon.Rapier:
          materials[MATERIAL_NAMES.HANDLE] = defaultMaterials.wood[LightestToDarkest.Medium];
          materials[MATERIAL_NAMES.HILT] = defaultMaterials.metal[LightestToDarkest.Medium];
          materials[MATERIAL_NAMES.ACCENT_1] = defaultMaterials.accent[AccentColor.Brass];
          break;
        case OneHandedMeleeWeapon.ShortSpear:
          materials[MATERIAL_NAMES.HANDLE] = defaultMaterials.wood[LightestToDarkest.Lighter];
          materials[MATERIAL_NAMES.ACCENT_2] = defaultMaterials.accent[AccentColor.Rose];
          break;
        case OneHandedMeleeWeapon.RuneSword:
          let i = 1;
          for (const classification of equipmentBaseItemProperties.damageClassification) {
            if (classification.elementOption !== null) {
              const material = new StandardMaterial(
                DYNAMIC_MATERIAL_TAG + formatMagicalElement(classification.elementOption)
              );

              const color = desaturate(ELEMENT_COLORS[classification.elementOption], 0.25);
              material.diffuseColor = color;
              material.roughness = 0;
              materials["Accent" + i] = material;
            }
            i += 1;
          }
          materials[MATERIAL_NAMES.HANDLE] = defaultMaterials.metal[LightestToDarkest.Medium];
          materials[MATERIAL_NAMES.HILT] = defaultMaterials.metal[LightestToDarkest.Darker];
          break;
        case OneHandedMeleeWeapon.EtherBlade:
          materials[MATERIAL_NAMES.HANDLE] = defaultMaterials.metal[LightestToDarkest.Medium];
          materials[MATERIAL_NAMES.HILT] = defaultMaterials.metal[LightestToDarkest.Darker];
          materials[MATERIAL_NAMES.BLADE] = defaultMaterials.custom[CustomMaterial.Ether];
          break;
        case OneHandedMeleeWeapon.IceBlade:
          materials[MATERIAL_NAMES.HANDLE] = defaultMaterials.metal[LightestToDarkest.Medium];
          materials[MATERIAL_NAMES.HILT] = defaultMaterials.metal[LightestToDarkest.Darker];
          materials[MATERIAL_NAMES.BLADE] = defaultMaterials.custom[CustomMaterial.Ice];
          materials[MATERIAL_NAMES.ACCENT_1] = defaultMaterials.metal[LightestToDarkest.Lightest];
          materials[MATERIAL_NAMES.ACCENT_2] = defaultMaterials.metal[LightestToDarkest.Darker];
          break;
        case OneHandedMeleeWeapon.MapleWand:
          materials[MATERIAL_NAMES.HANDLE] = defaultMaterials.wood[LightestToDarkest.Medium];
          materials[MATERIAL_NAMES.HILT] = defaultMaterials.metal[LightestToDarkest.Darker];
          materials[MATERIAL_NAMES.MAIN] = defaultMaterials.wood[LightestToDarkest.Darker];
          break;
        case OneHandedMeleeWeapon.WillowWand:
          materials[MATERIAL_NAMES.HANDLE] = defaultMaterials.wood[LightestToDarkest.Medium];
          materials[MATERIAL_NAMES.ACCENT_1] = defaultMaterials.accent[AccentColor.Brass];
          materials[MATERIAL_NAMES.MAIN] = defaultMaterials.accent[AccentColor.CobaltBlue];
          break;
        case OneHandedMeleeWeapon.YewWand:
          materials[MATERIAL_NAMES.HANDLE] = defaultMaterials.wood[LightestToDarkest.Darker];
          materials[MATERIAL_NAMES.ALTERNATE] = defaultMaterials.accent[AccentColor.Brass];
          materials[MATERIAL_NAMES.ACCENT_1] = defaultMaterials.custom[CustomMaterial.Ether];
          materials[MATERIAL_NAMES.MAIN] = defaultMaterials.metal[LightestToDarkest.Darker];
          materials[MATERIAL_NAMES.HILT] = defaultMaterials.accent[AccentColor.Brass];
          break;
        case OneHandedMeleeWeapon.RoseWand:
          materials[MATERIAL_NAMES.HANDLE] = defaultMaterials.wood[LightestToDarkest.Darker];
          materials[MATERIAL_NAMES.MAIN] = defaultMaterials.accent[AccentColor.Cherry];
          materials[MATERIAL_NAMES.ACCENT_1] = defaultMaterials.accent[AccentColor.Rose];
      }
      break;
    case EquipmentType.TwoHandedMeleeWeapon:
      switch (equipmentBaseItemProperties.baseItem) {
        case TwoHandedMeleeWeapon.BoStaff:
          materials[MATERIAL_NAMES.HANDLE] = defaultMaterials.wood[LightestToDarkest.Lighter];
          materials[MATERIAL_NAMES.HILT] = defaultMaterials.wood[LightestToDarkest.Lighter];
          materials[MATERIAL_NAMES.ACCENT_2] = defaultMaterials.wood[LightestToDarkest.Lighter];
          materials[MATERIAL_NAMES.ACCENT_1] = defaultMaterials.wood[LightestToDarkest.Lighter];
          break;
        case TwoHandedMeleeWeapon.Spear:
          materials[MATERIAL_NAMES.HANDLE] = defaultMaterials.wood[LightestToDarkest.Medium];
          break;
        case TwoHandedMeleeWeapon.Bardiche:
          materials[MATERIAL_NAMES.HANDLE] = defaultMaterials.wood[LightestToDarkest.Medium];
          materials[MATERIAL_NAMES.HILT] = defaultMaterials.metal[LightestToDarkest.Lighter];
          break;
        case TwoHandedMeleeWeapon.SplittingMaul:
          materials[MATERIAL_NAMES.HANDLE] = defaultMaterials.wood[LightestToDarkest.Darker];
          materials[MATERIAL_NAMES.ACCENT_2] = defaultMaterials.metal[LightestToDarkest.Darkest];
          break;
        case TwoHandedMeleeWeapon.Maul:
          materials[MATERIAL_NAMES.BLADE] = defaultMaterials.metal[LightestToDarkest.Darker];
          materials[MATERIAL_NAMES.HANDLE] = defaultMaterials.wood[LightestToDarkest.Darker];
          materials[MATERIAL_NAMES.ACCENT_1] = defaultMaterials.accent[AccentColor.Brass];
          break;
        case TwoHandedMeleeWeapon.BattleAxe:
          materials[MATERIAL_NAMES.HANDLE] = defaultMaterials.wood[LightestToDarkest.Medium];
          materials[MATERIAL_NAMES.ACCENT_2] = defaultMaterials.wood[LightestToDarkest.Darker];
          break;
        case TwoHandedMeleeWeapon.Glaive:
          materials[MATERIAL_NAMES.HANDLE] = defaultMaterials.wood[LightestToDarkest.Lighter];
          break;
        case TwoHandedMeleeWeapon.ElementalStaff:
          assignElementalMaterials(
            materials,
            gameWorld,
            equipmentBaseItemProperties.damageClassification
          );
          materials[MATERIAL_NAMES.HANDLE] = defaultMaterials.wood[LightestToDarkest.Lighter];
          materials[MATERIAL_NAMES.HILT] = defaultMaterials.wood[LightestToDarkest.Lighter];
          break;
        case TwoHandedMeleeWeapon.Trident:
          materials[MATERIAL_NAMES.ACCENT_1] = defaultMaterials.elements[MagicalElement.Water];
          materials[MATERIAL_NAMES.BLADE] = defaultMaterials.accent[AccentColor.Brass];
          materials[MATERIAL_NAMES.HILT] = defaultMaterials.accent[AccentColor.Brass];
          materials[MATERIAL_NAMES.HANDLE] = defaultMaterials.wood[LightestToDarkest.Medium];
          break;
        case TwoHandedMeleeWeapon.GreatAxe:
          materials[MATERIAL_NAMES.ALTERNATE] =
            defaultMaterials.custom[CustomMaterial.AncientMetal];
          materials[MATERIAL_NAMES.ACCENT_2] = defaultMaterials.metal[LightestToDarkest.Medium];
          materials[MATERIAL_NAMES.BLADE] = defaultMaterials.accent[AccentColor.DarkBlue];
          materials[MATERIAL_NAMES.HILT] = defaultMaterials.metal[LightestToDarkest.Darker];
          break;
        case TwoHandedMeleeWeapon.GravityHammer:
          materials[MATERIAL_NAMES.ACCENT_1] = defaultMaterials.metal[LightestToDarkest.Darker];
          materials[MATERIAL_NAMES.ACCENT_2] = defaultMaterials.custom[CustomMaterial.AncientMetal];
          materials[MATERIAL_NAMES.ALTERNATE] = defaultMaterials.accent[AccentColor.CobaltBlue];
          materials[MATERIAL_NAMES.BLADE] = defaultMaterials.accent[AccentColor.DarkBlue];
          materials[MATERIAL_NAMES.HANDLE] = defaultMaterials.metal[LightestToDarkest.Medium];
          break;
        case TwoHandedMeleeWeapon.ElmStaff:
          materials[MATERIAL_NAMES.HANDLE] = defaultMaterials.wood[LightestToDarkest.Darker];
          materials[MATERIAL_NAMES.ACCENT_1] = defaultMaterials.accent[AccentColor.BurntOrange];
          break;
        case TwoHandedMeleeWeapon.MahoganyStaff:
          materials[MATERIAL_NAMES.HANDLE] = defaultMaterials.wood[LightestToDarkest.Darker];
          materials[MATERIAL_NAMES.ACCENT_1] = defaultMaterials.accent[AccentColor.Brass];
          materials[MATERIAL_NAMES.ALTERNATE] = defaultMaterials.custom[CustomMaterial.Ice];
          break;
        case TwoHandedMeleeWeapon.EbonyStaff:
          materials[MATERIAL_NAMES.HANDLE] = defaultMaterials.wood[LightestToDarkest.Darkest];
          materials[MATERIAL_NAMES.ALTERNATE] = defaultMaterials.accent[AccentColor.Cherry];
          materials[MATERIAL_NAMES.ACCENT_1] = defaultMaterials.wood[LightestToDarkest.Darker];
          break;
      }
      break;
    case EquipmentType.TwoHandedRangedWeapon:
      switch (equipmentBaseItemProperties.baseItem) {
        case TwoHandedRangedWeapon.ShortBow:
          materials[MATERIAL_NAMES.MAIN] = defaultMaterials.wood[LightestToDarkest.Medium];
          materials[MATERIAL_NAMES.HANDLE] = defaultMaterials.wood[LightestToDarkest.Lighter];
          materials[MATERIAL_NAMES.ACCENT_1] = defaultMaterials.wood[LightestToDarkest.Lightest];
          break;
        case TwoHandedRangedWeapon.RecurveBow:
          materials[MATERIAL_NAMES.MAIN] = defaultMaterials.wood[LightestToDarkest.Darker];
          materials[MATERIAL_NAMES.ACCENT_1] = defaultMaterials.wood[LightestToDarkest.Lightest];
          break;
        case TwoHandedRangedWeapon.CompositeBow:
          materials[MATERIAL_NAMES.MAIN] = defaultMaterials.metal[LightestToDarkest.Medium];
          materials[MATERIAL_NAMES.HANDLE] = defaultMaterials.metal[LightestToDarkest.Darker];
          materials[MATERIAL_NAMES.ALTERNATE] = defaultMaterials.wood[LightestToDarkest.Lightest];
          break;
        case TwoHandedRangedWeapon.MilitaryBow:
          materials[MATERIAL_NAMES.MAIN] = defaultMaterials.accent[AccentColor.DarkBlue];
          materials[MATERIAL_NAMES.HANDLE] = defaultMaterials.metal[LightestToDarkest.Darker];
          materials[MATERIAL_NAMES.ALTERNATE] = defaultMaterials.wood[LightestToDarkest.Lightest];
          break;
        case TwoHandedRangedWeapon.EtherBow:
          materials[MATERIAL_NAMES.MAIN] = defaultMaterials.wood[LightestToDarkest.Darker];
          materials[MATERIAL_NAMES.HANDLE] = defaultMaterials.metal[LightestToDarkest.Darker];
          materials[MATERIAL_NAMES.ALTERNATE] = defaultMaterials.custom[CustomMaterial.Ether];
          materials[MATERIAL_NAMES.ACCENT_1] = defaultMaterials.custom[CustomMaterial.Ether];
          materials[MATERIAL_NAMES.ACCENT_2] = defaultMaterials.metal[LightestToDarkest.Darker];
          break;
      }
      break;
    case EquipmentType.Shield:
      switch (equipmentBaseItemProperties.baseItem) {
        case Shield.MakeshiftBuckler:
          materials = {
            [MATERIAL_NAMES.MAIN]: defaultMaterials.wood[LightestToDarkest.Darker],
            [MATERIAL_NAMES.ALTERNATE]: defaultMaterials.wood[LightestToDarkest.Medium],
            [MATERIAL_NAMES.ACCENT_1]: defaultMaterials.accent[AccentColor.Brass],
            [MATERIAL_NAMES.ACCENT_2]: defaultMaterials.wood[LightestToDarkest.Darkest],
          };
          break;
        case Shield.WoodenKiteShield:
          materials = {
            [MATERIAL_NAMES.MAIN]: defaultMaterials.wood[LightestToDarkest.Lightest],
            [MATERIAL_NAMES.ALTERNATE]: defaultMaterials.wood[LightestToDarkest.Lighter],
            [MATERIAL_NAMES.ACCENT_1]: defaultMaterials.metal[LightestToDarkest.Medium],
            [MATERIAL_NAMES.ACCENT_2]: defaultMaterials.wood[LightestToDarkest.Medium],
          };
          break;
        case Shield.Buckler:
          materials = {
            [MATERIAL_NAMES.MAIN]: defaultMaterials.metal[LightestToDarkest.Darker],
            [MATERIAL_NAMES.ALTERNATE]: defaultMaterials.metal[LightestToDarkest.Medium],
          };
          break;
        case Shield.Pavise:
          materials = {
            [MATERIAL_NAMES.MAIN]: defaultMaterials.wood[LightestToDarkest.Lightest],
            [MATERIAL_NAMES.ALTERNATE]: defaultMaterials.accent[AccentColor.BurntOrange],
            [MATERIAL_NAMES.ACCENT_1]: defaultMaterials.accent[AccentColor.Cherry],
          };
          break;
        case Shield.Aspis:
          materials = {
            [MATERIAL_NAMES.MAIN]: defaultMaterials.metal[LightestToDarkest.Medium],
            [MATERIAL_NAMES.ALTERNATE]: defaultMaterials.accent[AccentColor.Cherry],
            [MATERIAL_NAMES.ACCENT_1]: defaultMaterials.accent[AccentColor.Cherry],
            [MATERIAL_NAMES.ACCENT_2]: defaultMaterials.accent[AccentColor.BurntOrange],
            [MATERIAL_NAMES.ACCENT_3]: defaultMaterials.accent[AccentColor.KellyGreen],
          };
          break;
        case Shield.LanternShield:
          materials = {
            [MATERIAL_NAMES.MAIN]: defaultMaterials.metal[LightestToDarkest.Medium],
            [MATERIAL_NAMES.BLADE]: defaultMaterials.metal[LightestToDarkest.Lighter],
            [MATERIAL_NAMES.ALTERNATE]: defaultMaterials.accent[AccentColor.Brass],
          };
          break;
        case Shield.KiteShield:
          materials = {
            [MATERIAL_NAMES.MAIN]: defaultMaterials.metal[LightestToDarkest.Lighter],
            [MATERIAL_NAMES.ALTERNATE]: defaultMaterials.metal[LightestToDarkest.Medium],
          };
          break;
        case Shield.TowerShield:
          materials = {
            [MATERIAL_NAMES.MAIN]: defaultMaterials.wood[LightestToDarkest.Medium],
            [MATERIAL_NAMES.ALTERNATE]: defaultMaterials.metal[LightestToDarkest.Medium],
            [MATERIAL_NAMES.ACCENT_1]: defaultMaterials.accent[AccentColor.Brass],
          };
          break;
        case Shield.AncientBuckler:
          materials = {
            [MATERIAL_NAMES.MAIN]: defaultMaterials.accent[AccentColor.DarkBlue],
            [MATERIAL_NAMES.ALTERNATE]: defaultMaterials.accent[AccentColor.CobaltBlue],
            [MATERIAL_NAMES.ACCENT_1]: defaultMaterials.metal[LightestToDarkest.Medium],
            [MATERIAL_NAMES.ACCENT_2]: defaultMaterials.metal[LightestToDarkest.Lighter],
            [MATERIAL_NAMES.ACCENT_3]: defaultMaterials.custom[CustomMaterial.AncientMetal],
          };
          break;
        case Shield.GothicShield:
          materials = {
            [MATERIAL_NAMES.MAIN]: defaultMaterials.accent[AccentColor.DarkBlue],
            [MATERIAL_NAMES.ALTERNATE]: defaultMaterials.metal[LightestToDarkest.Medium],
            [MATERIAL_NAMES.ACCENT_1]: defaultMaterials.metal[LightestToDarkest.Lighter],
          };
          break;
      }
  }
  applyMaterialsToModelMeshes(itemModel, materials);
}

function assignElementalMaterials(
  materials: { [name: string]: StandardMaterial },
  gameWorld: GameWorld,
  damageClassification: HpChangeSource[]
) {
  let i = 1;
  for (const classification of damageClassification) {
    if (classification.elementOption !== null) {
      const material = gameWorld.defaultMaterials.elements[classification.elementOption];
      materials["Accent" + i] = material;
    }
    i += 1;
  }
}
