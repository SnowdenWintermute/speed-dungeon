import {
  EquipmentType,
  HpChangeSource,
  Item,
  ItemPropertiesType,
  MagicalElement,
  OneHandedMeleeWeapon,
  Shield,
  TwoHandedMeleeWeapon,
} from "@speed-dungeon/common";
import { GameWorld } from "..";
import { ISceneLoaderAsyncResult, Material, StandardMaterial } from "@babylonjs/core";
import { AccentColor, CustomMaterial, LightestToDarkest, MATERIAL_NAMES } from "./material-colors";
import applyMaterialsToModelMeshes from "./apply-materials-to-model-meshes";

export function assignEquipmentMaterials(
  gameWorld: GameWorld,
  item: Item,
  itemModel: ISceneLoaderAsyncResult
) {
  let materialsByName: { [name: string]: StandardMaterial } = {};
  if (item.itemProperties.type === ItemPropertiesType.Consumable) return;
  const { equipmentBaseItemProperties } = item.itemProperties.equipmentProperties;

  switch (equipmentBaseItemProperties.type) {
    case EquipmentType.OneHandedMeleeWeapon:
      materialsByName[MATERIAL_NAMES.BLADE] =
        gameWorld.defaultMaterials.metal[LightestToDarkest.Lighter];
      materialsByName[MATERIAL_NAMES.ACCENT_1] =
        gameWorld.defaultMaterials.metal[LightestToDarkest.Lightest];
      switch (equipmentBaseItemProperties.baseItem) {
        case OneHandedMeleeWeapon.Stick:
          materialsByName[MATERIAL_NAMES.HANDLE] =
            gameWorld.defaultMaterials.wood[LightestToDarkest.Lighter];
          break;
        case OneHandedMeleeWeapon.Mace:
          materialsByName[MATERIAL_NAMES.HANDLE] =
            gameWorld.defaultMaterials.wood[LightestToDarkest.Darker];
          break;
        case OneHandedMeleeWeapon.Morningstar:
          materialsByName[MATERIAL_NAMES.HANDLE] =
            gameWorld.defaultMaterials.wood[LightestToDarkest.Darkest];
          materialsByName[MATERIAL_NAMES.BLADE] =
            gameWorld.defaultMaterials.metal[LightestToDarkest.Darker];
          materialsByName[MATERIAL_NAMES.HILT] =
            gameWorld.defaultMaterials.metal[LightestToDarkest.Darker];
          break;
        case OneHandedMeleeWeapon.WarHammer:
          materialsByName[MATERIAL_NAMES.HANDLE] =
            gameWorld.defaultMaterials.wood[LightestToDarkest.Darker];
          materialsByName[MATERIAL_NAMES.BLADE] =
            gameWorld.defaultMaterials.metal[LightestToDarkest.Darkest];
          break;
        case OneHandedMeleeWeapon.ShortSword:
          materialsByName[MATERIAL_NAMES.HANDLE] =
            gameWorld.defaultMaterials.wood[LightestToDarkest.Medium];
          materialsByName[MATERIAL_NAMES.HILT] =
            gameWorld.defaultMaterials.metal[LightestToDarkest.Medium];
          break;
        case OneHandedMeleeWeapon.Blade:
          materialsByName[MATERIAL_NAMES.HANDLE] =
            gameWorld.defaultMaterials.wood[LightestToDarkest.Lighter];
          materialsByName[MATERIAL_NAMES.HILT] =
            gameWorld.defaultMaterials.metal[LightestToDarkest.Lightest];
          break;
        case OneHandedMeleeWeapon.BroadSword:
          materialsByName[MATERIAL_NAMES.HANDLE] =
            gameWorld.defaultMaterials.wood[LightestToDarkest.Darker];
          materialsByName[MATERIAL_NAMES.HILT] =
            gameWorld.defaultMaterials.metal[LightestToDarkest.Darker];
          materialsByName[MATERIAL_NAMES.BLADE] =
            gameWorld.defaultMaterials.metal[LightestToDarkest.Medium];
          break;
        case OneHandedMeleeWeapon.BastardSword:
          materialsByName[MATERIAL_NAMES.HANDLE] =
            gameWorld.defaultMaterials.wood[LightestToDarkest.Darker];
          materialsByName[MATERIAL_NAMES.HILT] =
            gameWorld.defaultMaterials.metal[LightestToDarkest.Darker];
          materialsByName[MATERIAL_NAMES.BLADE] =
            gameWorld.defaultMaterials.metal[LightestToDarkest.Darkest];
          break;
        case OneHandedMeleeWeapon.Dagger:
          materialsByName[MATERIAL_NAMES.HANDLE] =
            gameWorld.defaultMaterials.wood[LightestToDarkest.Lighter];
          materialsByName[MATERIAL_NAMES.HILT] =
            gameWorld.defaultMaterials.metal[LightestToDarkest.Medium];
          break;
        case OneHandedMeleeWeapon.Rapier:
          materialsByName[MATERIAL_NAMES.HANDLE] =
            gameWorld.defaultMaterials.wood[LightestToDarkest.Medium];
          materialsByName[MATERIAL_NAMES.HILT] =
            gameWorld.defaultMaterials.metal[LightestToDarkest.Medium];
          materialsByName[MATERIAL_NAMES.ACCENT_1] =
            gameWorld.defaultMaterials.accent[AccentColor.Brass];
          break;
        case OneHandedMeleeWeapon.ShortSpear:
          materialsByName[MATERIAL_NAMES.HANDLE] =
            gameWorld.defaultMaterials.wood[LightestToDarkest.Lighter];
          materialsByName[MATERIAL_NAMES.ACCENT_2] =
            gameWorld.defaultMaterials.accent[AccentColor.Rose];
          break;
        case OneHandedMeleeWeapon.RuneSword:
          assignElementalMaterials(
            materialsByName,
            gameWorld,
            equipmentBaseItemProperties.damageClassification
          );
          materialsByName[MATERIAL_NAMES.HANDLE] =
            gameWorld.defaultMaterials.metal[LightestToDarkest.Medium];
          materialsByName[MATERIAL_NAMES.HILT] =
            gameWorld.defaultMaterials.metal[LightestToDarkest.Darker];
          break;
        case OneHandedMeleeWeapon.EtherBlade:
          materialsByName[MATERIAL_NAMES.HANDLE] =
            gameWorld.defaultMaterials.metal[LightestToDarkest.Medium];
          materialsByName[MATERIAL_NAMES.HILT] =
            gameWorld.defaultMaterials.metal[LightestToDarkest.Darker];
          materialsByName[MATERIAL_NAMES.BLADE] =
            gameWorld.defaultMaterials.custom[CustomMaterial.Ether];
          break;
        case OneHandedMeleeWeapon.IceBlade:
          materialsByName[MATERIAL_NAMES.HANDLE] =
            gameWorld.defaultMaterials.metal[LightestToDarkest.Medium];
          materialsByName[MATERIAL_NAMES.HILT] =
            gameWorld.defaultMaterials.metal[LightestToDarkest.Darker];
          materialsByName[MATERIAL_NAMES.BLADE] =
            gameWorld.defaultMaterials.custom[CustomMaterial.Ice];
          materialsByName[MATERIAL_NAMES.ACCENT_1] =
            gameWorld.defaultMaterials.metal[LightestToDarkest.Lightest];
          materialsByName[MATERIAL_NAMES.ACCENT_2] =
            gameWorld.defaultMaterials.metal[LightestToDarkest.Darker];
          break;
        case OneHandedMeleeWeapon.MapleWand:
          materialsByName[MATERIAL_NAMES.HANDLE] =
            gameWorld.defaultMaterials.wood[LightestToDarkest.Medium];
          materialsByName[MATERIAL_NAMES.HILT] =
            gameWorld.defaultMaterials.metal[LightestToDarkest.Darker];
          materialsByName[MATERIAL_NAMES.MAIN] =
            gameWorld.defaultMaterials.wood[LightestToDarkest.Darker];
          break;
        case OneHandedMeleeWeapon.WillowWand:
          materialsByName[MATERIAL_NAMES.HANDLE] =
            gameWorld.defaultMaterials.wood[LightestToDarkest.Medium];
          materialsByName[MATERIAL_NAMES.ACCENT_1] =
            gameWorld.defaultMaterials.accent[AccentColor.Brass];
          materialsByName[MATERIAL_NAMES.MAIN] =
            gameWorld.defaultMaterials.accent[AccentColor.CobaltBlue];
          break;
        case OneHandedMeleeWeapon.YewWand:
          materialsByName[MATERIAL_NAMES.HANDLE] =
            gameWorld.defaultMaterials.wood[LightestToDarkest.Darker];
          materialsByName[MATERIAL_NAMES.ALTERNATE] =
            gameWorld.defaultMaterials.accent[AccentColor.Brass];
          materialsByName[MATERIAL_NAMES.ACCENT_1] =
            gameWorld.defaultMaterials.custom[CustomMaterial.Ether];
          materialsByName[MATERIAL_NAMES.MAIN] =
            gameWorld.defaultMaterials.metal[LightestToDarkest.Darker];
          materialsByName[MATERIAL_NAMES.HILT] =
            gameWorld.defaultMaterials.accent[AccentColor.Brass];
          break;
        case OneHandedMeleeWeapon.RoseWand:
          materialsByName[MATERIAL_NAMES.HANDLE] =
            gameWorld.defaultMaterials.wood[LightestToDarkest.Darker];
          materialsByName[MATERIAL_NAMES.MAIN] =
            gameWorld.defaultMaterials.accent[AccentColor.Cherry];
          materialsByName[MATERIAL_NAMES.ACCENT_1] =
            gameWorld.defaultMaterials.accent[AccentColor.Rose];
      }
      break;
    case EquipmentType.TwoHandedMeleeWeapon:
      switch (equipmentBaseItemProperties.baseItem) {
        case TwoHandedMeleeWeapon.BoStaff:
          materialsByName[MATERIAL_NAMES.HANDLE] =
            gameWorld.defaultMaterials.wood[LightestToDarkest.Lighter];
          materialsByName[MATERIAL_NAMES.HILT] =
            gameWorld.defaultMaterials.wood[LightestToDarkest.Lighter];
          materialsByName[MATERIAL_NAMES.ACCENT_2] =
            gameWorld.defaultMaterials.wood[LightestToDarkest.Lighter];
          materialsByName[MATERIAL_NAMES.ACCENT_1] =
            gameWorld.defaultMaterials.wood[LightestToDarkest.Lighter];
          break;
        case TwoHandedMeleeWeapon.Spear:
          materialsByName[MATERIAL_NAMES.HANDLE] =
            gameWorld.defaultMaterials.wood[LightestToDarkest.Medium];
          break;
        case TwoHandedMeleeWeapon.Bardiche:
          materialsByName[MATERIAL_NAMES.HANDLE] =
            gameWorld.defaultMaterials.wood[LightestToDarkest.Medium];
          materialsByName[MATERIAL_NAMES.HILT] =
            gameWorld.defaultMaterials.metal[LightestToDarkest.Lighter];
          break;
        case TwoHandedMeleeWeapon.SplittingMaul:
          materialsByName[MATERIAL_NAMES.HANDLE] =
            gameWorld.defaultMaterials.wood[LightestToDarkest.Darker];
          materialsByName[MATERIAL_NAMES.ACCENT_2] =
            gameWorld.defaultMaterials.metal[LightestToDarkest.Darkest];
          break;
        case TwoHandedMeleeWeapon.Maul:
          materialsByName[MATERIAL_NAMES.BLADE] =
            gameWorld.defaultMaterials.metal[LightestToDarkest.Darker];
          materialsByName[MATERIAL_NAMES.HANDLE] =
            gameWorld.defaultMaterials.wood[LightestToDarkest.Darker];
          materialsByName[MATERIAL_NAMES.ACCENT_1] =
            gameWorld.defaultMaterials.accent[AccentColor.Brass];
          break;
        case TwoHandedMeleeWeapon.BattleAxe:
          materialsByName[MATERIAL_NAMES.HANDLE] =
            gameWorld.defaultMaterials.wood[LightestToDarkest.Medium];
          materialsByName[MATERIAL_NAMES.ACCENT_2] =
            gameWorld.defaultMaterials.wood[LightestToDarkest.Darker];
          break;
        case TwoHandedMeleeWeapon.Glaive:
          materialsByName[MATERIAL_NAMES.HANDLE] =
            gameWorld.defaultMaterials.wood[LightestToDarkest.Lighter];
          break;
        case TwoHandedMeleeWeapon.ElementalStaff:
          assignElementalMaterials(
            materialsByName,
            gameWorld,
            equipmentBaseItemProperties.damageClassification
          );
          materialsByName[MATERIAL_NAMES.HANDLE] =
            gameWorld.defaultMaterials.wood[LightestToDarkest.Lighter];
          materialsByName[MATERIAL_NAMES.HILT] =
            gameWorld.defaultMaterials.wood[LightestToDarkest.Lighter];

          break;
        case TwoHandedMeleeWeapon.Trident:
        case TwoHandedMeleeWeapon.GreatAxe:
        case TwoHandedMeleeWeapon.GravityHammer:
        case TwoHandedMeleeWeapon.ElmStaff:
        case TwoHandedMeleeWeapon.MahoganyStaff:
        case TwoHandedMeleeWeapon.EbonyStaff:
      }
      break;
    case EquipmentType.TwoHandedRangedWeapon:
      break;
    case EquipmentType.Shield:
      switch (equipmentBaseItemProperties.baseItem) {
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
            [MATERIAL_NAMES.MAIN]: gameWorld.defaultMaterials.wood[LightestToDarkest.Medium],
            [MATERIAL_NAMES.ALTERNATE]: gameWorld.defaultMaterials.metal[LightestToDarkest.Medium],
            [MATERIAL_NAMES.ACCENT_1]: gameWorld.defaultMaterials.accent[AccentColor.Brass],
          };
          break;
        case Shield.AncientBuckler:
          materialsByName = {
            [MATERIAL_NAMES.MAIN]: gameWorld.defaultMaterials.accent[AccentColor.DarkBlue],
            [MATERIAL_NAMES.ALTERNATE]: gameWorld.defaultMaterials.accent[AccentColor.CobaltBlue],
            [MATERIAL_NAMES.ACCENT_1]: gameWorld.defaultMaterials.metal[LightestToDarkest.Medium],
            [MATERIAL_NAMES.ACCENT_2]: gameWorld.defaultMaterials.metal[LightestToDarkest.Lighter],
            [MATERIAL_NAMES.ACCENT_3]:
              gameWorld.defaultMaterials.custom[CustomMaterial.AncientMetal],
          };
          break;
        case Shield.GothicShield:
          materialsByName = {
            [MATERIAL_NAMES.MAIN]: gameWorld.defaultMaterials.accent[AccentColor.DarkBlue],
            [MATERIAL_NAMES.ALTERNATE]: gameWorld.defaultMaterials.metal[LightestToDarkest.Medium],
            [MATERIAL_NAMES.ACCENT_1]: gameWorld.defaultMaterials.metal[LightestToDarkest.Lighter],
          };
          break;
      }
  }
  applyMaterialsToModelMeshes(itemModel, materialsByName);
}

function assignElementalMaterials(
  materialsByName: { [name: string]: StandardMaterial },
  gameWorld: GameWorld,
  damageClassification: HpChangeSource[]
) {
  let i = 1;
  for (const classification of damageClassification) {
    if (classification.elementOption) {
      const material = gameWorld.defaultMaterials.elements[classification.elementOption];
      materialsByName["Accent" + i] = material;
    }
    i += 1;
  }
}
