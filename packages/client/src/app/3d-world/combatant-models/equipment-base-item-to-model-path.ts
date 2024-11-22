import {
  EquipmentProperties,
  EquipmentType,
  OneHandedMeleeWeapon,
  Shield,
  TwoHandedMeleeWeapon,
  TwoHandedRangedWeapon,
} from "@speed-dungeon/common";

export function equipmentBaseItemToModelPath(equipmentProperties: EquipmentProperties) {
  let filePath;
  const folderPath = MODEL_FOLDER_PATHS[equipmentProperties.equipmentBaseItemProperties.type];
  switch (equipmentProperties.equipmentBaseItemProperties.type) {
    case EquipmentType.BodyArmor:
      return null;
    case EquipmentType.HeadGear:
      return null;
    case EquipmentType.Ring:
      return null;
    case EquipmentType.Amulet:
      return null;
    case EquipmentType.OneHandedMeleeWeapon:
      filePath =
        ONE_HANDED_MELEE_WEAPON_MODEL_PATHS[
          equipmentProperties.equipmentBaseItemProperties.baseItem
        ];
      break;
    case EquipmentType.TwoHandedMeleeWeapon:
      filePath =
        TWO_HANDED_MELEE_WEAPON_MODEL_PATHS[
          equipmentProperties.equipmentBaseItemProperties.baseItem as TwoHandedMeleeWeapon
        ];
      break;
    case EquipmentType.TwoHandedRangedWeapon:
      filePath =
        TWO_HANDED_RANGED_WEAPON_MODEL_PATHS[
          equipmentProperties.equipmentBaseItemProperties.baseItem as TwoHandedRangedWeapon
        ];
      break;
    case EquipmentType.Shield:
      filePath = SHIELD_MODEL_PATHS[equipmentProperties.equipmentBaseItemProperties.baseItem];
      break;
  }
  if (!folderPath || !filePath) return null;
  return folderPath + filePath;
}

export const MODEL_FOLDER_PATHS: Record<EquipmentType, null | string> = {
  [EquipmentType.BodyArmor]: null,
  [EquipmentType.HeadGear]: null,
  [EquipmentType.Ring]: null,
  [EquipmentType.Amulet]: null,
  [EquipmentType.OneHandedMeleeWeapon]: "equipment/holdables/one-handed-melee/",
  [EquipmentType.TwoHandedMeleeWeapon]: "equipment/holdables/two-handed-melee/",
  [EquipmentType.TwoHandedRangedWeapon]: "equipment/holdables/two-handed-ranged/",
  [EquipmentType.Shield]: "equipment/holdables/shields/",
};

export const ONE_HANDED_MELEE_WEAPON_MODEL_PATHS: Record<OneHandedMeleeWeapon, null | string> = {
  [OneHandedMeleeWeapon.Stick]: "broad-sword.glb",
  [OneHandedMeleeWeapon.Mace]: "mace.glb",
  [OneHandedMeleeWeapon.Morningstar]: null,
  [OneHandedMeleeWeapon.WarHammer]: null,
  [OneHandedMeleeWeapon.ShortSword]: "short-sword.glb",
  [OneHandedMeleeWeapon.Blade]: null,
  [OneHandedMeleeWeapon.BroadSword]: "broad-sword.glb",
  [OneHandedMeleeWeapon.BastardSword]: null,
  [OneHandedMeleeWeapon.Dagger]: "dagger.glb",
  [OneHandedMeleeWeapon.Rapier]: null,
  [OneHandedMeleeWeapon.ShortSpear]: "spear.glb",
  [OneHandedMeleeWeapon.RuneSword]: null,
  [OneHandedMeleeWeapon.EtherBlade]: null,
  [OneHandedMeleeWeapon.IceBlade]: null,
  [OneHandedMeleeWeapon.MapleWand]: null,
  [OneHandedMeleeWeapon.WillowWand]: null,
  [OneHandedMeleeWeapon.YewWand]: null,
  [OneHandedMeleeWeapon.RoseWand]: null,
};

export const TWO_HANDED_MELEE_WEAPON_MODEL_PATHS: Record<TwoHandedMeleeWeapon, null | string> = {
  [TwoHandedMeleeWeapon.BoStaff]: "gem-staff.glb",
  [TwoHandedMeleeWeapon.Spear]: null,
  [TwoHandedMeleeWeapon.Bardiche]: null,
  [TwoHandedMeleeWeapon.SplittingMaul]: null,
  [TwoHandedMeleeWeapon.Maul]: null,
  [TwoHandedMeleeWeapon.BattleAxe]: null,
  [TwoHandedMeleeWeapon.Glaive]: null,
  [TwoHandedMeleeWeapon.ElementalStaff]: null,
  [TwoHandedMeleeWeapon.Trident]: null,
  [TwoHandedMeleeWeapon.GreatAxe]: null,
  [TwoHandedMeleeWeapon.GravityHammer]: null,
  [TwoHandedMeleeWeapon.ElmStaff]: null,
  [TwoHandedMeleeWeapon.MahoganyStaff]: "gem-staff.glb",
  [TwoHandedMeleeWeapon.EbonyStaff]: null,
};

export const TWO_HANDED_RANGED_WEAPON_MODEL_PATHS: Record<TwoHandedRangedWeapon, null | string> = {
  [TwoHandedRangedWeapon.ShortBow]: "short-bow.glb",
  [TwoHandedRangedWeapon.RecurveBow]: null,
  [TwoHandedRangedWeapon.CompositeBow]: null,
  [TwoHandedRangedWeapon.MilitaryBow]: null,
  [TwoHandedRangedWeapon.EtherBow]: null,
};

export const SHIELD_MODEL_PATHS: Record<Shield, null | string> = {
  [Shield.MakeshiftBuckler]: "buckler.glb",
  [Shield.WoodenKiteShield]: null,
  [Shield.Buckler]: "buckler.glb",
  [Shield.Pavise]: null,
  [Shield.Aspis]: null,
  [Shield.LanternShield]: null,
  [Shield.KiteShield]: null,
  [Shield.TowerShield]: null,
  [Shield.AncientBuckler]: null,
  [Shield.GothicShield]: null,
};
