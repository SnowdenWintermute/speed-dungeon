import { EquipmentProperties, EquipmentType, OneHandedMeleeWeapon } from "@speed-dungeon/common";

export function equipmentBaseItemToModelPath(equipmentProperties: EquipmentProperties) {
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
      const modelFileName =
        ONE_HANDED_MELEE_WEAPON_MODEL_PATHS[
          equipmentProperties.equipmentBaseItemProperties.baseItem
        ];
      if (modelFileName === null) return null;
      return (
        "equipment/weapons/one-handed-melee/" +
        ONE_HANDED_MELEE_WEAPON_MODEL_PATHS[
          equipmentProperties.equipmentBaseItemProperties.baseItem
        ]
      );
    case EquipmentType.TwoHandedMeleeWeapon:
      return null;
    case EquipmentType.TwoHandedRangedWeapon:
      return null;
    case EquipmentType.Shield:
      return null;
  }
}

export const ONE_HANDED_MELEE_WEAPON_MODEL_PATHS: Record<OneHandedMeleeWeapon, null | string> = {
  [OneHandedMeleeWeapon.Stick]: null,
  [OneHandedMeleeWeapon.Mace]: null,
  [OneHandedMeleeWeapon.Morningstar]: null,
  [OneHandedMeleeWeapon.WarHammer]: null,
  [OneHandedMeleeWeapon.ShortSword]: "sword.glb",
  [OneHandedMeleeWeapon.Blade]: null,
  [OneHandedMeleeWeapon.BroadSword]: null,
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
