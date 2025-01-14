import { useGameStore } from "@/stores/game-store";
import { Vector3 } from "@babylonjs/core";
import {
  CombatAction,
  CombatActionType,
  AbilityName,
  CombatantProperties,
  ERROR_MESSAGES,
  getCombatActionHpChangeRange,
  Combatant,
  CombatantClass,
  CombatantSpecies,
  CombatAttribute,
  Equipment,
  HoldableSlotType,
  CombatantEquipment,
} from "@speed-dungeon/common";
import { WeaponProperties } from "@speed-dungeon/common";
import { EquipmentType } from "@speed-dungeon/common";
import { NumberRange } from "@speed-dungeon/common";
import { getActionHitChance, getActionCritChance } from "@speed-dungeon/common";
import React from "react";
import { getTargetOption } from "@/utils/get-target-option";

export default function CharacterSheetWeaponDamage({ combatant }: { combatant: Combatant }) {
  const { combatantProperties } = combatant;

  const mhWeaponOption = CombatantProperties.getEquippedWeapon(
    combatantProperties,
    HoldableSlotType.MainHand
  );

  if (mhWeaponOption instanceof Error) return <div>{mhWeaponOption.message}</div>;
  const mhDamageAndAccuracyResult = getAttackAbilityDamageAndAccuracy(
    combatant,
    mhWeaponOption,
    false
  );
  const isTwoHanded = mhWeaponOption
    ? Equipment.isTwoHanded(mhWeaponOption.taggedBaseEquipment.equipmentType)
    : false;

  const ohEquipmentOption = CombatantEquipment.getEquippedHoldable(
    combatantProperties,
    HoldableSlotType.OffHand
  );

  if (ohEquipmentOption instanceof Error) return <div>{ohEquipmentOption.message}</div>;

  let ohDamageAndAccuracyResult;
  if (
    !isTwoHanded &&
    ohEquipmentOption?.equipmentBaseItemProperties.taggedBaseEquipment.equipmentType !==
      EquipmentType.Shield
  ) {
    let ohWeaponOption = CombatantProperties.getEquippedWeapon(
      combatantProperties,
      HoldableSlotType.OffHand
    );
    if (ohWeaponOption instanceof Error) ohWeaponOption = undefined; // might be a shield
    ohDamageAndAccuracyResult = getAttackAbilityDamageAndAccuracy(combatant, ohWeaponOption, true);
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
        paddingClass="pr-1"
      />
      <WeaponDamageEntry
        damageAndAccuracyOption={ohDamageAndAccuracyResult}
        label="Off Hand"
        paddingClass="pl-1"
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
        critChance: number;
      };
  label: string;
  paddingClass: string;
}

function WeaponDamageEntry(props: WeaponDamageEntryProps) {
  if (!props.damageAndAccuracyOption) return <div className={`w-1/2 mr-1${props.paddingClass}`} />;
  const { hpChangeRange, hitChance, critChance } = props.damageAndAccuracyOption;

  return (
    <div className={`w-1/2 min-w-1/2 ${props.paddingClass}`}>
      <div className="w-full flex justify-between">
        <span>{props.label}</span>
        <span>{`${hpChangeRange.min}-${hpChangeRange.max}`}</span>
      </div>
      <div className="w-full flex justify-between items-center">
        <span>{"Accuracy "}</span>
        <span>{hitChance.toFixed(0)}%</span>
      </div>
      <div className="w-full flex justify-between items-center">
        <span>{"Crit chance "}</span>
        <span>{critChance.toFixed(0)}%</span>
      </div>
    </div>
  );
}

function getAttackAbilityDamageAndAccuracy(
  combatant: Combatant,
  weaponOption: undefined | WeaponProperties,
  isOffHand: boolean
) {
  let abilityName = isOffHand ? AbilityName.AttackMeleeOffhand : AbilityName.AttackMeleeMainhand;
  const { combatantProperties } = combatant;

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

  const gameOption = useGameStore.getState().game;

  const targetResult = getTargetOption(gameOption, combatant, combatAction);
  if (targetResult instanceof Error) return targetResult;
  const target =
    targetResult ||
    new CombatantProperties(
      CombatantClass.Warrior,
      CombatantSpecies.Humanoid,
      null,
      null,
      Vector3.Zero()
    );

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
    [HoldableSlotType.MainHand, HoldableSlotType.OffHand]
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
    CombatantProperties.getTotalAttributes(target)[CombatAttribute.Evasion],
    !!attackActionPropertiesResult.hpChangeProperties.hpChangeSource.unavoidable,
    false
  );

  const critChance = getActionCritChance(hpChangeProperties, combatantProperties, target, false);

  return { hpChangeRange, hitChance, critChance };
}
