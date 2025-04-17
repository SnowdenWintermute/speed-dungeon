import { AdventuringParty } from "../../adventuring-party/index.js";
import getCombatantInParty from "../../adventuring-party/get-combatant-in-party.js";
import { TargetCategories } from "../combat-actions/targeting-schemes-and-categories.js";
import {
  PROHIBITED_TARGET_COMBATANT_STATE_CALCULATORS,
  PROHIBITED_TARGET_COMBATANT_STATE_STRINGS,
  ProhibitedTargetCombatantStates,
} from "../combat-actions/prohibited-target-combatant-states.js";
import { EntityId } from "../../primatives/index.js";

export function filterPossibleTargetIdsByProhibitedCombatantStates(
  party: AdventuringParty,
  prohibitedStates: null | ProhibitedTargetCombatantStates[],
  allyIds: string[],
  opponentIdsOption: string[]
): Error | [string[], string[]] {
  if (prohibitedStates === null) {
    console.log("no prohibitedStates");
    return [allyIds, opponentIdsOption];
  }
  const filteredAllyIdsResult = filterTargetIdGroupByProhibitedCombatantStates(
    party,
    allyIds,
    prohibitedStates
  );
  if (filteredAllyIdsResult instanceof Error) return filteredAllyIdsResult;

  let filteredOpponentIdsOption: EntityId[] = [];

  if (opponentIdsOption.length) {
    const filteredOpponentIdsResult = filterTargetIdGroupByProhibitedCombatantStates(
      party,
      opponentIdsOption,
      prohibitedStates
    );
    if (filteredOpponentIdsResult instanceof Error) return filteredOpponentIdsResult;
    filteredOpponentIdsOption = filteredOpponentIdsResult;
  }

  return [filteredAllyIdsResult, filteredOpponentIdsOption];
}

function filterTargetIdGroupByProhibitedCombatantStates(
  party: AdventuringParty,
  potentialIds: string[],
  prohibitedStates: ProhibitedTargetCombatantStates[]
) {
  const filteredIds = [];

  for (let targetId of potentialIds) {
    const combatantResult = getCombatantInParty(party, targetId);
    if (combatantResult instanceof Error) return combatantResult;
    const { entityProperties: _, combatantProperties: combatantProperties } = combatantResult;
    let targetIsInProhibitedState = false;

    for (const combatantState of prohibitedStates) {
      console.log("filtering: ", PROHIBITED_TARGET_COMBATANT_STATE_STRINGS[combatantState]);
      targetIsInProhibitedState =
        PROHIBITED_TARGET_COMBATANT_STATE_CALCULATORS[combatantState](combatantResult);
      if (targetIsInProhibitedState) break;
    }

    if (targetIsInProhibitedState) continue;
    else filteredIds.push(targetId);
  }

  return filteredIds;
}

export function filterPossibleTargetIdsByActionTargetCategories(
  targetCategories: TargetCategories,
  actionUserId: string,
  allyIds: string[],
  opponentIdsOption: string[]
): [string[], string[]] {
  switch (targetCategories) {
    case TargetCategories.Opponent:
      return [[], opponentIdsOption];
    case TargetCategories.User:
      return [[actionUserId], []];
    case TargetCategories.Friendly:
      return [allyIds, []];
    case TargetCategories.Any:
      return [allyIds, opponentIdsOption];
  }
}
