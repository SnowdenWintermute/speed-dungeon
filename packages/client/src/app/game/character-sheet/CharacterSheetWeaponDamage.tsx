import {
  AbilityUsed,
  CombatAction,
  CombatActionType,
  CombatAttribute,
  CombatantAbilityNames,
  CombatantProperties,
  WeaponSlot,
} from "@speed-dungeon/common";
import { getCombatActionPropertiesIfOwned } from "@speed-dungeon/common/src/combatants/get-combat-action-properties";
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
      case EquipmentType.OneHandedMeleeWeapon:
        break;
      case EquipmentType.TwoHandedMeleeWeapon:
        mhIsTwoHanded = true;
        break;
      case EquipmentType.TwoHandedRangedWeapon:
        mhIsTwoHanded = true;
        mhAbilityName = CombatantAbilityNames.AttackRangedMainhand;
        break;
    }
  }

  const mhAttackAction: CombatAction = {
    type: CombatActionType.AbilityUsed,
    abilityName: mhAbilityName,
  };

  const mhAttackActionProperties =
    combatantProperties.getCombatActionPropertiesIfOwned(mhAttackAction);

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
