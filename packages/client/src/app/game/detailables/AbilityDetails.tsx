import { UNMET_REQUIREMENT_TEXT_COLOR } from "@/client_consts";
import {
  CombatActionProperties,
  CombatantAbility,
  AbilityName,
  CombatantProperties,
  getCombatActionHpChangeRange,
  CombatActionType,
  Combatant,
  CombatAction,
  getActionCritChance,
  CombatantClass,
  CombatantSpecies,
} from "@speed-dungeon/common";
import React from "react";
import CharacterSheetWeaponDamage from "../character-sheet/CharacterSheetWeaponDamage";
import { NumberRange } from "@speed-dungeon/common";
import DamageTypeBadge from "./DamageTypeBadge";
import { ABILITY_ATTRIBUTES } from "@speed-dungeon/common";
import { checkIfTargetWantsToBeHit } from "@speed-dungeon/common";
import { getTargetOption } from "@/utils/get-target-option";
import { useGameStore } from "@/stores/game-store";
import { Vector3 } from "@babylonjs/core";

interface Props {
  ability: CombatantAbility;
  combatActionProperties: CombatActionProperties;
  user: Combatant;
}

export default function AbilityDetails({ ability, combatActionProperties, user }: Props) {
  const { combatantProperties: userCombatantProperties } = user;
  const abilityAttributes = ABILITY_ATTRIBUTES[ability.name];
  const mpCostResult = CombatantProperties.getAbilityCostIfOwned(
    userCombatantProperties,
    ability.name
  );
  if (mpCostResult instanceof Error) return <div>{mpCostResult.message}</div>;
  const mpCost = mpCostResult;
  const mpCostStyle = mpCost > userCombatantProperties.mana ? UNMET_REQUIREMENT_TEXT_COLOR : "";

  const attackDamageDisplay =
    ability.name === AbilityName.Attack ? <CharacterSheetWeaponDamage combatant={user} /> : <></>;

  let valueRangeOption: null | NumberRange = null;
  let critChanceOption: null | number = null;
  const combatAction: CombatAction = {
    type: CombatActionType.AbilityUsed,
    abilityName: ability.name,
  };
  if (combatActionProperties.hpChangeProperties) {
    const gameOption = useGameStore.getState().game;

    const targetResult = getTargetOption(gameOption, user, {
      type: CombatActionType.AbilityUsed,
      abilityName: ability.name,
    });
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
    const targetWantsToBeHit = checkIfTargetWantsToBeHit(
      target,
      abilityAttributes.combatActionProperties.hpChangeProperties || undefined
    );

    critChanceOption = getActionCritChance(
      combatActionProperties.hpChangeProperties,
      user.combatantProperties,
      target,
      targetWantsToBeHit
    );
    let valueRangeOptionResult = getCombatActionHpChangeRange(
      combatAction,
      combatActionProperties.hpChangeProperties,
      userCombatantProperties,
      {}
    );
    if (valueRangeOptionResult instanceof Error) return <div>{valueRangeOptionResult.message}</div>;
    valueRangeOption = valueRangeOptionResult;
  }

  return (
    <div className="flex flex-col justify-between overflow-y-auto">
      {mpCost > 0 && <div className={`${mpCostStyle}`}>{`MP Cost: ${mpCost}`}</div>}
      {valueRangeOption && (
        <div>{`Value range: ${valueRangeOption.min} - ${valueRangeOption.max}`}</div>
      )}
      {critChanceOption && <div>{`Crit chance: ${critChanceOption}%`}</div>}
      {attackDamageDisplay}
      {combatActionProperties.hpChangeProperties && (
        <div className="mt-1 mb-1">
          <DamageTypeBadge
            hpChangeSource={combatActionProperties.hpChangeProperties.hpChangeSource}
          />
        </div>
      )}
    </div>
  );
}
