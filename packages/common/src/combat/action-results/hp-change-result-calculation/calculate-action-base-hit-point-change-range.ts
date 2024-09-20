import cloneDeep from "lodash.clonedeep";
import { CombatantProperties } from "../../../combatants/index.js";
import { SpeedDungeonGame } from "../../../game/index.js";
import { CombatActionHpChangeProperties } from "../../combat-actions/index.js";
import { COMBATANT_LEVEL_ACTION_VALUE_LEVEL_MODIFIER } from "../../../app_consts.js";
import { EquipmentProperties, EquipmentSlot, WeaponSlot } from "../../../items/index.js";

export default function calculateActionBaseHitPointChangeRange(
  game: SpeedDungeonGame,
  userCombatantProperties: CombatantProperties,
  hpChangeProperties: CombatActionHpChangeProperties,
  abilityLevelAndBaseValueScalingFactorOption: null | [number, number]
) {
  const combatAttributes = CombatantProperties.getTotalAttributes(userCombatantProperties);
  const combatantLevel = userCombatantProperties.level;

  let range = cloneDeep(hpChangeProperties.baseValues);
  if (abilityLevelAndBaseValueScalingFactorOption !== null) {
    const [abilityLevel, abilityLevelScalingFactor] = abilityLevelAndBaseValueScalingFactorOption;
    range.min *= abilityLevel * abilityLevelScalingFactor;
    range.max *= abilityLevel * abilityLevelScalingFactor;
  }
  if (hpChangeProperties.additiveAttributeAndPercentScalingFactor !== null) {
    const [additiveAttribute, attributePercentScalingFactor] =
      hpChangeProperties.additiveAttributeAndPercentScalingFactor;
    const attributeValue = combatAttributes[additiveAttribute] || 0;
    const scaledAttributeAdditiveValue = attributeValue * (attributePercentScalingFactor / 100);
    const combatantLevelAdjustedValue =
      (scaledAttributeAdditiveValue * combatantLevel) / COMBATANT_LEVEL_ACTION_VALUE_LEVEL_MODIFIER;

    range.min += combatantLevelAdjustedValue;
    range.max += combatantLevelAdjustedValue;
  }

  // ADD WEAPON DAMAGE
  if (hpChangeProperties.addWeaponDamageFrom !== null) {
    for (const weaponSlot of hpChangeProperties.addWeaponDamageFrom) {
      let equipmentSlot =
        weaponSlot === WeaponSlot.OffHand ? EquipmentSlot.OffHand : EquipmentSlot.MainHand;
      const weaponEquipmentProperties = CombatantProperties.getEquipmentInSlot(
        userCombatantProperties,
        equipmentSlot
      );
      if (weaponEquipmentProperties) {
        const weaponDamageResult =
          EquipmentProperties.getModifiedWeaponDamageRange(weaponEquipmentProperties);
        if (weaponDamageResult instanceof Error) return weaponDamageResult;
        range.min += weaponDamageResult.min;
        range.max += weaponDamageResult.max;
      }
    }
  }

  return range;
}
