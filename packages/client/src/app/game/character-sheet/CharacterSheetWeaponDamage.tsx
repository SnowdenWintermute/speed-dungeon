import {
  CombatAction,
  CombatActionType,
  CombatAttribute,
  CombatantAbilityName,
  CombatantProperties,
  ERROR_MESSAGES,
  EquipmentProperties,
  EquipmentSlot,
  WeaponSlot,
  calculateCombatActionHpChangeRange,
} from "@speed-dungeon/common";
import getAbilityAttributes from "@speed-dungeon/common/src/combatants/abilities/get-ability-attributes";
import { WeaponProperties } from "@speed-dungeon/common/src/items/equipment/equipment-properties/weapon-properties";
import { EquipmentType } from "@speed-dungeon/common/src/items/equipment/equipment-types";
import { NumberRange } from "@speed-dungeon/common";
import React from "react";

export default function CharacterSheetWeaponDamage({
  combatantProperties,
}: {
  combatantProperties: CombatantProperties;
}) {
  const combatAttributes = CombatantProperties.getTotalAttributes(combatantProperties);
  const combatantAccuracy = combatAttributes[CombatAttribute.Accuracy] || 0;

  const mhWeaponOption = CombatantProperties.getEquippedWeapon(
    combatantProperties,
    WeaponSlot.MainHand
  );
  const mhDamageAndAccuracyResult = getAttackAbilityDamageAndAccuracy(
    combatantProperties,
    mhWeaponOption,
    combatantAccuracy,
    false
  );
  const isTwoHanded = mhWeaponOption ? EquipmentProperties.isTwoHanded(mhWeaponOption.type) : false;
  const ohEquipmentOption = CombatantProperties.getEquipmentInSlot(
    combatantProperties,
    EquipmentSlot.OffHand
  );
  let ohDamageAndAccuracyResult;
  if (
    !isTwoHanded &&
    ohEquipmentOption?.equipmentBaseItemProperties.type !== EquipmentType.Shield
  ) {
    const ohWeaponOption = CombatantProperties.getEquippedWeapon(
      combatantProperties,
      WeaponSlot.OffHand
    );
    ohDamageAndAccuracyResult = getAttackAbilityDamageAndAccuracy(
      combatantProperties,
      ohWeaponOption,
      combatantAccuracy,
      true
    );
  }

  if (mhDamageAndAccuracyResult instanceof Error)
    return <div>{mhDamageAndAccuracyResult.message}</div>;
  if (ohDamageAndAccuracyResult instanceof Error)
    return <div>{ohDamageAndAccuracyResult.message}</div>;

  return (
    <div className="flex">
      <WeaponDamageEntry
        damageAndAccuracyOption={mhDamageAndAccuracyResult}
        label="Main Hand"
        paddingClass="mr-1"
      />
      <WeaponDamageEntry
        damageAndAccuracyOption={ohDamageAndAccuracyResult}
        label="Off Hand"
        paddingClass="ml-1"
      />
    </div>
  );
}

interface WeaponDamageEntryProps {
  damageAndAccuracyOption: undefined | [NumberRange, number];
  label: string;
  paddingClass: string;
}

function WeaponDamageEntry(props: WeaponDamageEntryProps) {
  if (!props.damageAndAccuracyOption) return <div className={`w-1/2 mr-1${props.paddingClass}`} />;
  const [damage, accuracy] = props.damageAndAccuracyOption;

  return (
    <div className={`w-1/2 ${props.paddingClass}`}>
      <div className="w-full flex justify-between">
        <span>{props.label}</span>
        <span>{`${damage.min.toFixed(0)}-${damage.max.toFixed(0)}`}</span>
      </div>
      <div className="w-full flex justify-between">
        <span>{"Accuracy"}</span>
        <span>{accuracy.toFixed(0)}</span>
      </div>
    </div>
  );
}

function getAttackAbilityDamageAndAccuracy(
  combatantProperties: CombatantProperties,
  weaponOption: undefined | WeaponProperties,
  combatantAccuracy: number,
  isOffHand: boolean
): Error | [NumberRange, number] {
  let abilityName = isOffHand
    ? CombatantAbilityName.AttackMeleeOffhand
    : CombatantAbilityName.AttackMeleeMainhand;

  if (weaponOption) {
    const weaponProperties = weaponOption;
    switch (weaponProperties.type) {
      case EquipmentType.TwoHandedRangedWeapon:
        abilityName = CombatantAbilityName.AttackRangedMainhand;
      case EquipmentType.TwoHandedMeleeWeapon:
        break;
      case EquipmentType.OneHandedMeleeWeapon:
    }
  }

  const attackAction: CombatAction = {
    type: CombatActionType.AbilityUsed,
    abilityName: abilityName,
  };

  const attackActionPropertiesResult = CombatantProperties.getCombatActionPropertiesIfOwned(
    combatantProperties,
    attackAction
  );
  if (attackActionPropertiesResult instanceof Error) return attackActionPropertiesResult;
  if (attackActionPropertiesResult.hpChangeProperties === null)
    return new Error(ERROR_MESSAGES.ABILITIES.INVALID_TYPE);
  const hpChangeProperties = attackActionPropertiesResult.hpChangeProperties;
  const abilityAttributes = getAbilityAttributes(abilityName);

  const damageRangeResult = calculateCombatActionHpChangeRange(
    combatantProperties,
    hpChangeProperties,
    1,
    abilityAttributes.baseHpChangeValuesLevelMultiplier
  );

  if (damageRangeResult instanceof Error) return damageRangeResult;

  damageRangeResult;
  damageRangeResult.min *= hpChangeProperties.finalDamagePercentMultiplier / 100;
  damageRangeResult.max *= hpChangeProperties.finalDamagePercentMultiplier / 100;
  const modifiedAccuracy = combatantAccuracy * (hpChangeProperties.accuracyPercentModifier / 100);

  return [damageRangeResult, modifiedAccuracy];
}
