import { UNMET_REQUIREMENT_TEXT_COLOR } from "@/client_consts";
import { CombatActionComponent, Combatant, iterateNumericEnum } from "@speed-dungeon/common";
import React from "react";
import { NumberRange } from "@speed-dungeon/common";
import DamageTypeBadge from "./DamageTypeBadge";
import { ActionPayableResource } from "@speed-dungeon/common";

interface Props {
  action: CombatActionComponent;
  user: Combatant;
}

export default function ActionCosts({ action, user }: Props) {
  const { combatantProperties: userCombatantProperties } = user;

  const costsOption = action.getResourceCosts(userCombatantProperties);

  if (!costsOption) return <></>;

  for (const resource of iterateNumericEnum(ActionPayableResource)) {
    if (resource !== ActionPayableResource.ConsumableType) {
      const valueOption = costsOption[resource];
      if (valueOption === undefined) continue;
    } else {
      const consumableTypeOption = costsOption[resource];
      if (consumableTypeOption === undefined) continue;
    }
  }

  const mpCost = mpCostResult;
  const mpCostStyle = mpCost > userCombatantProperties.mana ? UNMET_REQUIREMENT_TEXT_COLOR : "";

  let valueRangeOption: null | NumberRange = null;
  let critChanceOption: null | number = null;
  const combatAction: CombatAction = {
    type: CombatActionType.AbilityUsed,
    abilityName: ability.name,
  };

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

// Main hand (melee)
// costs [1 mp, 1 hp, 1 shard, 1 quick action]
// 133 - 289 damage
// 78% to hit
// 4% critical
//
// Off hand (melee)
// costs [1 mp, 1 hp, 1 shard, 1 quick action]
// 133 - 289 damage
// 78% to hit
// 4% critical
//
// VALUE RANGE VS TARGET OR UNARMORED DUMMY
//
// if (combatActionProperties.hpChangeProperties) {
//   const gameOption = useGameStore.getState().game;

//   const targetResult = getTargetOption(gameOption, user, {
//     type: CombatActionType.AbilityUsed,
//     abilityName: ability.name,
//   });
//   if (targetResult instanceof Error) return <div>{targetResult.message}</div>;
//   const target =
//     targetResult ||
//     new CombatantProperties(
//       CombatantClass.Warrior,
//       CombatantSpecies.Humanoid,
//       null,
//       null,
//       Vector3.Zero()
//     );
//   const targetWantsToBeHit = checkIfTargetWantsToBeHit(
//     target,
//     abilityAttributes.combatActionProperties.hpChangeProperties || undefined
//   );

//   critChanceOption = getActionCritChance(
//     combatActionProperties.hpChangeProperties,
//     user.combatantProperties,
//     target,
//     targetWantsToBeHit
//   );
//   let valueRangeOptionResult = getCombatActionHpChangeRange(
//     combatAction,
//     combatActionProperties.hpChangeProperties,
//     userCombatantProperties,
//     {}
//   );
//   if (valueRangeOptionResult instanceof Error) return <div>{valueRangeOptionResult.message}</div>;
//   valueRangeOption = valueRangeOptionResult;
// }
