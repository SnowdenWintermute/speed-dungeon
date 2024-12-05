import { UNMET_REQUIREMENT_TEXT_COLOR } from "@/client_consts";
import {
  CombatActionProperties,
  CombatantAbility,
  AbilityName,
  CombatantProperties,
  calculateCombatActionHpChangeRange,
} from "@speed-dungeon/common";
import React from "react";
import CharacterSheetWeaponDamage from "../character-sheet/CharacterSheetWeaponDamage";
import { NumberRange } from "@speed-dungeon/common";
import DamageTypeBadge from "./DamageTypeBadge";

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
  const abilityAttributes = CombatantAbility.getAttributes(ability.name);
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
    let valueRangeOptionResult = calculateCombatActionHpChangeRange(
      userCombatantProperties,
      combatActionProperties.hpChangeProperties,
      ability.level,
      abilityAttributes.baseHpChangeValuesLevelMultiplier
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
          hpChangeSource={combatActionProperties.hpChangeProperties.sourceProperties}
        />
      )}
    </div>
  );
}
