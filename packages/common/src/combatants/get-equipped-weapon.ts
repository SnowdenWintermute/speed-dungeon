import { EquipmentSlot, WeaponSlot } from "../items/index.js";
import { WeaponProperties } from "../items/equipment/equipment-properties/weapon-properties.js";
import { EquipmentType } from "../items/equipment/equipment-types/index.js";
import { CombatantProperties } from "./combatant-properties.js";

export default function getEquippedWeapon(
  combatantProperties: CombatantProperties,
  slot: WeaponSlot
): undefined | WeaponProperties {
  const equipmentSlot =
    slot === WeaponSlot.OffHand ? EquipmentSlot.OffHand : EquipmentSlot.MainHand;
  const equipmentPropertiesOption = CombatantProperties.getEquipmentInSlot(
    combatantProperties,
    equipmentSlot
  );
  if (!equipmentPropertiesOption) return undefined;
  switch (equipmentPropertiesOption.equipmentBaseItemProperties.type) {
    case EquipmentType.OneHandedMeleeWeapon:
    case EquipmentType.TwoHandedMeleeWeapon:
    case EquipmentType.TwoHandedRangedWeapon:
      return equipmentPropertiesOption.equipmentBaseItemProperties;
    case EquipmentType.BodyArmor:
    case EquipmentType.HeadGear:
    case EquipmentType.Shield:
      return undefined;
  }
}
