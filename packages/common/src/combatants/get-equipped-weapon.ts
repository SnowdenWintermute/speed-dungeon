import { EquipmentSlot, WeaponSlot } from "../items";
import { WeaponProperties } from "../items/equipment/equipment-properties/weapon-properties";
import { EquipmentTrait } from "../items/equipment/equipment-traits";
import { EquipmentType } from "../items/equipment/equipment-types";
import { CombatantProperties } from "./combatant-properties";

export default function getEquippedWeapon(
  combatantProperties: CombatantProperties,
  slot: WeaponSlot
): undefined | [WeaponProperties, EquipmentTrait[]] {
  const equipmentSlot =
    slot === WeaponSlot.OffHand ? EquipmentSlot.OffHand : EquipmentSlot.MainHand;
  const equipmentPropertiesOption = CombatantProperties.getEquipmentInSlot(
    combatantProperties,
    equipmentSlot
  );
  if (!equipmentPropertiesOption) return undefined;
  switch (equipmentPropertiesOption.equipmentTypeProperties.type) {
    case EquipmentType.OneHandedMeleeWeapon:
    case EquipmentType.TwoHandedMeleeWeapon:
    case EquipmentType.TwoHandedRangedWeapon:
      return [equipmentPropertiesOption.equipmentTypeProperties, equipmentPropertiesOption.traits];
    case EquipmentType.BodyArmor:
    case EquipmentType.HeadGear:
    case EquipmentType.Shield:
      return undefined;
  }
}
