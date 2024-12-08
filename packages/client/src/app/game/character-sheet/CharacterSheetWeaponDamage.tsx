import { useGameStore } from "@/stores/game-store";
import { Vector3 } from "@babylonjs/core";
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
  HP_CALCLULATION_CONTEXTS,
  ActionResultCalculator,
  SpeedDungeonGame,
  CombatActionTarget,
  Combatant,
  CombatantClass,
  CombatantSpecies,
  applyWeaponHpChangeModifiers,
  Battle,
  HP_CHANGE_SOURCE_CATEGORY_STRINGS,
} from "@speed-dungeon/common";
import { WeaponProperties } from "@speed-dungeon/common";
import { EquipmentType } from "@speed-dungeon/common";
import { NumberRange } from "@speed-dungeon/common";
import { getActionHitChance } from "@speed-dungeon/common";
import React from "react";

export default function CharacterSheetWeaponDamage({ combatant }: { combatant: Combatant }) {
  const { combatantProperties } = combatant;

  const mhWeaponOption = CombatantProperties.getEquippedWeapon(
    combatantProperties,
    WeaponSlot.MainHand
  );

  if (mhWeaponOption instanceof Error) return <div>{mhWeaponOption.message}</div>;
  const mhDamageAndAccuracyResult = getAttackAbilityDamageAndAccuracy(
    combatant,
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
      <div className="w-full flex justify-between">
        <span>{"Accuracy "}</span>
        <span>{hitChance.toFixed(0)}%</span>
      </div>
      <div className="w-full flex justify-between">
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
  const { entityProperties, combatantProperties } = combatant;

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

  const target =
    getTargetOption(
      gameOption,
      combatAction,
      entityProperties.id,
      combatantProperties.combatActionTarget
    ) ||
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

  const averageRoll = Math.floor(hpChangeRange.min + hpChangeRange.max / 2);

  applyWeaponHpChangeModifiers(
    hpChangeProperties,
    equippedUsableWeapons,
    combatantProperties,
    target,
    averageRoll
  );

  const hitChance = getActionHitChance(
    attackActionPropertiesResult,
    combatantProperties,
    0,
    !!attackActionPropertiesResult.hpChangeProperties.hpChangeSource.unavoidable,
    false
  );

  console.log(
    "HP CHANGE SOURCE CATEGORY ",
    HP_CHANGE_SOURCE_CATEGORY_STRINGS[hpChangeProperties.hpChangeSource.category]
  );

  const hpCalculationContext = HP_CALCLULATION_CONTEXTS[hpChangeProperties.hpChangeSource.category];

  const critChance = hpCalculationContext.getActionCritChance(combatantProperties, target, false);

  return { hpChangeRange, hitChance, critChance };
}

function getTargetOption(
  gameOption: null | SpeedDungeonGame,
  combatAction: CombatAction,
  userId: string,
  targets: CombatActionTarget | null
) {
  if (!gameOption || !targets) return undefined;
  const game = gameOption;
  const partyResult = useGameStore().getParty();
  if (partyResult instanceof Error) return undefined;
  const battleOption = partyResult.battleId ? game.battles[partyResult.battleId]!! : null;

  const allyIds = (() => {
    if (battleOption) {
      const result = Battle.getAllyIdsAndOpponentIdsOption(battleOption, userId);
      if (result instanceof Error) return partyResult.characterPositions;
      return result.allyIds;
    }
    return partyResult.characterPositions;
  })();

  const args = {
    combatAction,
    userId,
    targets,
    battleOption,
    allyIds,
  };

  const targetIdsResult = ActionResultCalculator.getCombatActionTargetIds(game, args);
  if (targetIdsResult instanceof Error) return undefined;
  const targetIds = targetIdsResult;
  const firstTargetIdOption = targetIds[0];
  if (firstTargetIdOption === undefined) return undefined;
  const firstTargetCombatant = SpeedDungeonGame.getCombatantById(game, firstTargetIdOption);
  if (firstTargetCombatant instanceof Error) return undefined;
  return firstTargetCombatant.combatantProperties;
}
