import {
  CombatAction,
  CombatActionType,
  CombatAttribute,
  CombatantAbilityNames,
  CombatantProperties,
  WeaponSlot,
  calculateCombatActionHpChangeRange,
} from "@speed-dungeon/common";
import getAbilityAttributes from "@speed-dungeon/common/src/combatants/abilities/get-ability-attributes";
import { EquipmentType } from "@speed-dungeon/common/src/items/equipment/equipment-types";
import React from "react";

export default function CharacterSheetWeaponDamage({
  combatantProperties,
}: {
  combatantProperties: CombatantProperties;
}) {
  const combatAttributes = combatantProperties.getTotalAttributes();
  const combatantAccuracy = combatAttributes[CombatAttribute.Accuracy] || 0;
  const mhWeaponOption = combatantProperties.getEquippedWeapon(WeaponSlot.MainHand);
  let mhIsTwoHanded = false;
  let mhAbilityName = CombatantAbilityNames.AttackMeleeMainhand;
  if (mhWeaponOption) {
    const [mhWeaponProperties, mhWeaponTraits] = mhWeaponOption;
    switch (mhWeaponProperties.type) {
      case EquipmentType.TwoHandedRangedWeapon:
        mhAbilityName = CombatantAbilityNames.AttackRangedMainhand;
      case EquipmentType.TwoHandedMeleeWeapon:
        mhIsTwoHanded = true;
        break;
      case EquipmentType.OneHandedMeleeWeapon:
    }
  }

  const mhAttackAction: CombatAction = {
    type: CombatActionType.AbilityUsed,
    abilityName: mhAbilityName,
  };

  const mhAttackActionPropertiesResult =
    combatantProperties.getCombatActionPropertiesIfOwned(mhAttackAction);
  if (mhAttackActionPropertiesResult instanceof Error)
    return <div>{mhAttackActionPropertiesResult.message}</div>;
  const mhAbilityAttributes = getAbilityAttributes(mhAbilityName);

  const mhDamageRangeResult = calculateCombatActionHpChangeRange(
    combatantProperties,
    mhAttackActionPropertiesResult.hpChangeProperties!,
    1,
    mhAbilityAttributes.baseHpChangeValuesLevelMultiplier
  );

  if (mhDamageRangeResult instanceof Error) return <div>{mhDamageRangeResult.message}</div>;

  return (
    <div className="flex">
      {
        // weapon_damage_entry(mh_damage_and_acc_option, &"Main Hand", &"mr-1")
      }
      {
        // weapon_damage_entry(oh_damage_and_acc_option, &"Off Hand", &"ml-1")
      }
    </div>
  );
}
