import { useGameStore } from "@/stores/game-store";
import {
  CombatantProperties,
  ERROR_MESSAGES,
  Combatant,
  CombatAttribute,
  Equipment,
  HoldableSlotType,
  CombatantEquipment,
  CombatActionName,
  COMBAT_ACTIONS,
  CombatActionResource,
  HitOutcomeMitigationCalculator,
} from "@speed-dungeon/common";
import { WeaponProperties } from "@speed-dungeon/common";
import { EquipmentType } from "@speed-dungeon/common";
import { NumberRange } from "@speed-dungeon/common";
import React from "react";
import { getTargetOption } from "@/utils/get-target-option";
import { TARGET_DUMMY_COMBATANT } from "./ability-tree/action-description";

export default function CharacterSheetWeaponDamage({ combatant }: { combatant: Combatant }) {
  const { combatantProperties } = combatant;

  const mhWeaponOption = CombatantProperties.getEquippedWeapon(
    combatantProperties,
    HoldableSlotType.MainHand
  );

  if (mhWeaponOption instanceof Error) return <div>{mhWeaponOption.message}</div>;
  const mhDamageAndAccuracyResult = getAttackActionDamageAndAccuracy(
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
    ohDamageAndAccuracyResult = getAttackActionDamageAndAccuracy(combatant, ohWeaponOption, true);
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
        hitChance: {
          beforeEvasion: number;
          afterEvasion: number;
        };
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
        <span>{`${hpChangeRange.min.toFixed(0)}-${hpChangeRange.max.toFixed(0)}`}</span>
      </div>
      <div className="w-full flex justify-between items-center">
        <span>{"Accuracy "}</span>
        <span>{hitChance.afterEvasion.toFixed(0)}%</span>
      </div>
      <div className="w-full flex justify-between items-center">
        <span>{"Crit chance "}</span>
        <span>{critChance.toFixed(0)}%</span>
      </div>
    </div>
  );
}

function getAttackActionDamageAndAccuracy(
  combatant: Combatant,
  weaponOption: undefined | WeaponProperties,
  isOffHand: boolean
) {
  let actionName = isOffHand
    ? CombatActionName.AttackMeleeOffhand
    : CombatActionName.AttackMeleeMainhand;
  const { combatantProperties } = combatant;

  if (weaponOption) {
    const weaponProperties = weaponOption;
    switch (weaponProperties.equipmentType) {
      case EquipmentType.TwoHandedRangedWeapon:
        actionName = CombatActionName.AttackRangedMainhand;
      case EquipmentType.TwoHandedMeleeWeapon:
        break;
      case EquipmentType.OneHandedMeleeWeapon:
    }
  }

  const gameOption = useGameStore.getState().game;

  const currentlyTargetedCombatantResult = getTargetOption(gameOption, combatant, actionName);
  if (currentlyTargetedCombatantResult instanceof Error) return currentlyTargetedCombatantResult;
  const target = currentlyTargetedCombatantResult || TARGET_DUMMY_COMBATANT;

  const combatAction = COMBAT_ACTIONS[actionName];
  const hpChangeProperties = combatAction.hitOutcomeProperties.resourceChangePropertiesGetters![
    CombatActionResource.HitPoints
  ]!(combatantProperties, 1, target);
  if (hpChangeProperties === null) return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.INVALID_TYPE);

  const hpChangeRangeResult = hpChangeProperties.baseValues;

  if (hpChangeRangeResult instanceof Error) return hpChangeRangeResult;

  const hpChangeRange = hpChangeRangeResult;
  const hitChance = HitOutcomeMitigationCalculator.getActionHitChance(
    combatAction,
    combatantProperties,
    1,
    CombatantProperties.getTotalAttributes(target)[CombatAttribute.Evasion],
    false
  );

  const critChance = HitOutcomeMitigationCalculator.getActionCritChance(
    combatAction,
    1,
    combatantProperties,
    target,
    false
  );

  return { hpChangeRange, hitChance, critChance };
}
