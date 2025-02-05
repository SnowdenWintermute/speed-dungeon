import { AdventuringParty } from "../../adventuring-party/index.js";
import getCombatantInParty from "../../adventuring-party/get-combatant-in-party.js";
import { TargetCategories } from "../combat-actions/targeting-schemes-and-categories.js";
import { ProhibitedTargetCombatantStates } from "../combat-actions/prohibited-target-combatant-states.js";

export function filterPossibleTargetIdsByProhibitedCombatantStates(
  party: AdventuringParty,
  prohibitedStates: null | ProhibitedTargetCombatantStates[],
  allyIds: string[],
  opponentIdsOption: null | string[]
): Error | [string[], null | string[]] {
  if (prohibitedStates === null) return [allyIds, opponentIdsOption];
  const filteredAllyIdsResult = filterTargetIdGroupByProhibitedCombatantStates(
    party,
    allyIds,
    prohibitedStates
  );
  if (filteredAllyIdsResult instanceof Error) return filteredAllyIdsResult;

  let filteredOpponentIdsOption = null;

  if (opponentIdsOption) {
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
      switch (combatantState) {
        case ProhibitedTargetCombatantStates.Dead:
          if (combatantProperties.hitPoints <= 0) targetIsInProhibitedState = true;
          break;
        case ProhibitedTargetCombatantStates.Alive:
          if (combatantProperties.hitPoints > 0) targetIsInProhibitedState = true;
          break;
      }
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
  opponentIdsOption: null | string[]
): [null | string[], null | string[]] {
  switch (targetCategories) {
    case TargetCategories.Opponent:
      return [null, opponentIdsOption];
    case TargetCategories.User:
      return [[actionUserId], null];
    case TargetCategories.Friendly:
      return [allyIds, null];
    case TargetCategories.Any:
      return [allyIds, opponentIdsOption];
  }
}
