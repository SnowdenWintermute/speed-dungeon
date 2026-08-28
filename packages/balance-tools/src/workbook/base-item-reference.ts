import {
  Amulet,
  BodyArmor,
  EquipmentType,
  HeadGear,
  OneHandedMeleeWeapon,
  Ring,
  Shield,
  TwoHandedMeleeWeapon,
  TwoHandedRangedWeapon,
} from "@speed-dungeon/common";
import type { EquipmentBaseItem } from "@speed-dungeon/common";

// kept out of enum-lookups.ts, which reaches node:fs through workbook-reader. the browser emitters
// need this too, and there nodePolyfills would shim node:fs rather than fail

/**
 * The enums a `getBaseItemReference` result can name, as shorthand so the compiler checks each
 * against a real binding. Every emitter that writes base items needs the same set, and it belongs
 * beside the function whose output refers to them.
 */
export const BASE_ITEM_IMPORT_CANDIDATES = {
  Amulet,
  BodyArmor,
  HeadGear,
  OneHandedMeleeWeapon,
  Ring,
  Shield,
  TwoHandedMeleeWeapon,
  TwoHandedRangedWeapon,
};

/** the source text a generated module needs, eg "BodyArmor.Rags" */
export function getBaseItemReference(baseItem: EquipmentBaseItem): string {
  switch (baseItem.equipmentType) {
    case EquipmentType.BodyArmor:
      return `BodyArmor.${BodyArmor[baseItem.baseItemType]}`;
    case EquipmentType.HeadGear:
      return `HeadGear.${HeadGear[baseItem.baseItemType]}`;
    case EquipmentType.OneHandedMeleeWeapon:
      return `OneHandedMeleeWeapon.${OneHandedMeleeWeapon[baseItem.baseItemType]}`;
    case EquipmentType.TwoHandedMeleeWeapon:
      return `TwoHandedMeleeWeapon.${TwoHandedMeleeWeapon[baseItem.baseItemType]}`;
    case EquipmentType.TwoHandedRangedWeapon:
      return `TwoHandedRangedWeapon.${TwoHandedRangedWeapon[baseItem.baseItemType]}`;
    case EquipmentType.Shield:
      return `Shield.${Shield[baseItem.baseItemType]}`;
    case EquipmentType.Ring:
      return `Ring.${Ring[baseItem.baseItemType]}`;
    case EquipmentType.Amulet:
      return `Amulet.${Amulet[baseItem.baseItemType]}`;
  }
}
