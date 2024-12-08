import {
  CombatAction,
  CombatActionType,
  AbilityName,
  CombatantProperties,
  ERROR_MESSAGES,
  EquipmentProperties,
  EquipmentSlot,
  WeaponSlot,
  getCombatActionHpChangeRange,
} from "@speed-dungeon/common";
import { WeaponProperties } from "@speed-dungeon/common";
import { EquipmentType } from "@speed-dungeon/common";
import { NumberRange } from "@speed-dungeon/common";
import { getActionHitChance } from "@speed-dungeon/common";
import React from "react";

export default function CharacterSheetWeaponDamage({
  combatantProperties,
}: {
  combatantProperties: CombatantProperties;
}) {
  const mhWeaponOption = CombatantProperties.getEquippedWeapon(
    combatantProperties,
    WeaponSlot.MainHand
  );
  if (mhWeaponOption instanceof Error) return <div>{mhWeaponOption.message}</div>;
  const mhDamageAndAccuracyResult = getAttackAbilityDamageAndAccuracy(
    combatantProperties,
    mhWeaponOption,
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
    let ohWeaponOption = CombatantProperties.getEquippedWeapon(
      combatantProperties,
      WeaponSlot.OffHand
    );
    if (ohWeaponOption instanceof Error) ohWeaponOption = undefined; // might be a shield
    ohDamageAndAccuracyResult = getAttackAbilityDamageAndAccuracy(
      combatantProperties,
      ohWeaponOption,
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
  damageAndAccuracyOption:
    | undefined
    | {
        hpChangeRange: NumberRange;
        hitChance: number;
      };
  label: string;
  paddingClass: string;
}

function WeaponDamageEntry(props: WeaponDamageEntryProps) {
  if (!props.damageAndAccuracyOption) return <div className={`w-1/2 mr-1${props.paddingClass}`} />;
  const { hpChangeRange, hitChance } = props.damageAndAccuracyOption;

  return (
    <div className={`w-1/2 ${props.paddingClass}`}>
      <div className="w-full flex justify-between">
        <span>{props.label}</span>
        <span>{`${hpChangeRange.min}-${hpChangeRange.max}`}</span>
      </div>
      <div className="w-full flex justify-between">
        <span>{"Accuracy "}</span>
        <span>{hitChance.toFixed(0)}%</span>
      </div>
    </div>
  );
}

function getAttackAbilityDamageAndAccuracy(
  combatantProperties: CombatantProperties,
  weaponOption: undefined | WeaponProperties,
  isOffHand: boolean
) {
  let abilityName = isOffHand ? AbilityName.AttackMeleeOffhand : AbilityName.AttackMeleeMainhand;

  if (weaponOption) {
    const weaponProperties = weaponOption;
    switch (weaponProperties.type) {
      case EquipmentType.TwoHandedRangedWeapon:
        abilityName = AbilityName.AttackRangedMainhand;
      case EquipmentType.TwoHandedMeleeWeapon:
        break;
      case EquipmentType.OneHandedMeleeWeapon:
    }
  }

  const combatAction: CombatAction = {
    type: CombatActionType.AbilityUsed,
    abilityName: abilityName,
  };

  const attackActionPropertiesResult = CombatantProperties.getCombatActionPropertiesIfOwned(
    combatantProperties,
    combatAction
  );
  if (attackActionPropertiesResult instanceof Error) return attackActionPropertiesResult;
  if (attackActionPropertiesResult.hpChangeProperties === null)
    return new Error(ERROR_MESSAGES.ABILITIES.INVALID_TYPE);
  const hpChangeProperties = attackActionPropertiesResult.hpChangeProperties;

  const equippedUsableWeaponsResult = CombatantProperties.getUsableWeaponsInSlots(
    combatantProperties,
    [WeaponSlot.MainHand, WeaponSlot.OffHand]
  );
  if (equippedUsableWeaponsResult instanceof Error) return equippedUsableWeaponsResult;
  const equippedUsableWeapons = equippedUsableWeaponsResult;

  const hpChangeRangeResult = getCombatActionHpChangeRange(
    combatAction,
    hpChangeProperties,
    combatantProperties,
    equippedUsableWeapons
  );
  if (hpChangeRangeResult instanceof Error) return hpChangeRangeResult;

  const hpChangeRange = hpChangeRangeResult;

  const hitChance = getActionHitChance(
    attackActionPropertiesResult,
    combatantProperties,
    0,
    !!attackActionPropertiesResult.hpChangeProperties.hpChangeSource.unavoidable,
    false
  );

  return { hpChangeRange, hitChance };
}
