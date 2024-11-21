import { EquipmentBaseItem, EquipmentType, OneHandedMeleeWeapon } from "@speed-dungeon/common";

export function equipmentBaseItemToModelPath(baseItem: EquipmentBaseItem) {
  switch (baseItem.equipmentType) {
    case EquipmentType.BodyArmor:
      return "";
    case EquipmentType.HeadGear:
      return "";
    case EquipmentType.Ring:
      return "";
    case EquipmentType.Amulet:
      return "";
    case EquipmentType.OneHandedMeleeWeapon:
      return ONE_HANDED_MELEE_WEAPON_MODEL_PATHS[baseItem.baseItemType];
    case EquipmentType.TwoHandedMeleeWeapon:
      return "";
    case EquipmentType.TwoHandedRangedWeapon:
      return "";
    case EquipmentType.Shield:
      return "";
  }
}

export const ONE_HANDED_MELEE_WEAPON_MODEL_PATHS: Record<OneHandedMeleeWeapon, string> = {
  [OneHandedMeleeWeapon.Stick]: "",
  [OneHandedMeleeWeapon.Mace]: "",
  [OneHandedMeleeWeapon.Morningstar]: "",
  [OneHandedMeleeWeapon.WarHammer]: "",
  [OneHandedMeleeWeapon.ShortSword]: "sword.glb",
  [OneHandedMeleeWeapon.Blade]: "",
  [OneHandedMeleeWeapon.BroadSword]: "",
  [OneHandedMeleeWeapon.BastardSword]: "",
  [OneHandedMeleeWeapon.Dagger]: "dagger.glb",
  [OneHandedMeleeWeapon.Rapier]: "",
  [OneHandedMeleeWeapon.ShortSpear]: "spear.glb",
  [OneHandedMeleeWeapon.RuneSword]: "",
  [OneHandedMeleeWeapon.EtherBlade]: "",
  [OneHandedMeleeWeapon.IceBlade]: "",
  [OneHandedMeleeWeapon.MapleWand]: "",
  [OneHandedMeleeWeapon.WillowWand]: "",
  [OneHandedMeleeWeapon.YewWand]: "",
  [OneHandedMeleeWeapon.RoseWand]: "",
};
