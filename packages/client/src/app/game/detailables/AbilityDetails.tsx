import { UNMET_REQUIREMENT_TEXT_COLOR } from "@/client_consts";
import {
  CombatActionProperties,
  CombatantAbility,
  AbilityName,
  CombatantProperties,
  getCombatActionHpChangeRange,
  CombatActionType,
} from "@speed-dungeon/common";
import React from "react";
import CharacterSheetWeaponDamage from "../character-sheet/CharacterSheetWeaponDamage";
import { NumberRange } from "@speed-dungeon/common";
import DamageTypeBadge from "./DamageTypeBadge";
import { ABILITY_ATTRIBUTES } from "@speed-dungeon/common";

interface Props {
  ability: CombatantAbility;
  combatActionProperties: CombatActionProperties;
  userCombatantProperties: CombatantProperties;
}

export default function AbilityDetails({
  ability,
  combatActionProperties,
  userCombatantProperties,
}: Props) {
  const abilityAttributes = ABILITY_ATTRIBUTES[ability.name];
  const mpCostResult = CombatantProperties.getAbilityCostIfOwned(
    userCombatantProperties,
    ability.name
  );
  if (mpCostResult instanceof Error) return <div>{mpCostResult.message}</div>;
  const mpCost = mpCostResult;
  const mpCostStyle = mpCost > userCombatantProperties.mana ? UNMET_REQUIREMENT_TEXT_COLOR : "";

  const attackDamageDisplay =
    ability.name === AbilityName.Attack ? (
      <CharacterSheetWeaponDamage combatantProperties={userCombatantProperties} />
    ) : (
      <></>
    );

  let valueRangeOption: null | NumberRange = null;
  if (combatActionProperties.hpChangeProperties) {
    let valueRangeOptionResult = getCombatActionHpChangeRange(
      { type: CombatActionType.AbilityUsed, abilityName: ability.name },
      combatActionProperties.hpChangeProperties,
      userCombatantProperties,
      {}
    );
    if (valueRangeOptionResult instanceof Error) return <div>{valueRangeOptionResult.message}</div>;
    valueRangeOption = valueRangeOptionResult;
  }

  return (
    <div className="flex flex-col justify-between">
      {mpCost > 0 && <div className={`${mpCostStyle}`}>{`MP Cost: ${mpCost}`}</div>}
      {valueRangeOption && (
        <div className="mb-1">{`Value range: ${valueRangeOption.min} - ${valueRangeOption.max}`}</div>
      )}
      {attackDamageDisplay}
      {combatActionProperties.hpChangeProperties && (
        <DamageTypeBadge
          hpChangeSource={combatActionProperties.hpChangeProperties.hpChangeSource}
        />
      )}
    </div>
  );
}
