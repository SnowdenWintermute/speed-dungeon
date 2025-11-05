import { AdventuringParty } from "../../adventuring-party/index.js";
import {
  FriendOrFoe,
  TargetCategories,
} from "../combat-actions/targeting-schemes-and-categories.js";
import {
  PROHIBITED_TARGET_COMBATANT_STATE_CALCULATORS,
  ProhibitedTargetCombatantStates,
} from "../combat-actions/prohibited-target-combatant-states.js";
import { EntityId } from "../../primatives/index.js";

export class TargetFilterer {
  constructor() {}

  static filterPossibleTargetIdsByProhibitedCombatantStates(
    party: AdventuringParty,
    prohibitedStates: null | ProhibitedTargetCombatantStates[],
    allyAndOpponentIds: Record<FriendOrFoe, EntityId[]>
  ): Record<FriendOrFoe, EntityId[]> {
    if (prohibitedStates === null) {
      return allyAndOpponentIds;
    }

    const filteredAllyIds = TargetFilterer.filterTargetIdGroupByProhibitedCombatantStates(
      party,
      allyAndOpponentIds[FriendOrFoe.Friendly],
      prohibitedStates
    );

    const filteredOpponentIds = TargetFilterer.filterTargetIdGroupByProhibitedCombatantStates(
      party,
      allyAndOpponentIds[FriendOrFoe.Hostile],
      prohibitedStates
    );

    return {
      [FriendOrFoe.Friendly]: filteredAllyIds,
      [FriendOrFoe.Hostile]: filteredOpponentIds,
    };
  }

  static filterTargetIdGroupByProhibitedCombatantStates(
    party: AdventuringParty,
    potentialIds: string[],
    prohibitedStates: ProhibitedTargetCombatantStates[]
  ) {
    const filteredIds = [];

    for (let targetId of potentialIds) {
      const combatantResult = party.combatantManager.getExpectedCombatant(targetId);
      let targetIsInProhibitedState = false;

      for (const combatantState of prohibitedStates) {
        targetIsInProhibitedState =
          PROHIBITED_TARGET_COMBATANT_STATE_CALCULATORS[combatantState](combatantResult);
        if (targetIsInProhibitedState) {
          break;
        }
      }

      if (targetIsInProhibitedState) continue;
      else filteredIds.push(targetId);
    }

    return filteredIds;
  }

  static filterPossibleTargetIdsByActionTargetCategories(
    targetCategories: TargetCategories,
    actionUserId: string,
    allyAndOpponentIds: Record<FriendOrFoe, EntityId[]>
  ) {
    switch (targetCategories) {
      case TargetCategories.Opponent:
        allyAndOpponentIds[FriendOrFoe.Friendly] = [];
        break;
      case TargetCategories.User:
        allyAndOpponentIds[FriendOrFoe.Hostile] = [];
        allyAndOpponentIds[FriendOrFoe.Friendly] = [actionUserId];
        break;
      case TargetCategories.Friendly:
        allyAndOpponentIds[FriendOrFoe.Hostile] = [];
        break;
      case TargetCategories.Any:
        return;
    }
  }
}
