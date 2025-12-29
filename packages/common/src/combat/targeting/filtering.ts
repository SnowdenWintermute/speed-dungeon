import { AdventuringParty } from "../../adventuring-party/index.js";
import {
  FriendOrFoe,
  TargetCategories,
} from "../combat-actions/targeting-schemes-and-categories.js";
import {
  PROHIBITED_TARGET_COMBATANT_STATE_CALCULATORS,
  ProhibitedTargetCombatantStates,
} from "../combat-actions/prohibited-target-combatant-states.js";
import { EntityId } from "../../aliases.js";
import { ActionUserType, IActionUser } from "../../action-user-context/action-user.js";
import { CombatantConditionName } from "../../conditions/condition-names.js";

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class TargetFilterer {
  static filterPossibleTargetIdsByProhibitedCombatantStates(
    party: AdventuringParty,
    prohibitedStates: null | ProhibitedTargetCombatantStates[],
    allyAndOpponentIds: Record<FriendOrFoe, EntityId[]>,
    actionUser: IActionUser
  ): Record<FriendOrFoe, EntityId[]> {
    if (prohibitedStates === null) {
      return allyAndOpponentIds;
    }

    const filteredAllyIds = TargetFilterer.filterTargetIdGroupByProhibitedCombatantStates(
      party,
      allyAndOpponentIds[FriendOrFoe.Friendly],
      prohibitedStates,
      actionUser
    );

    const filteredOpponentIds = TargetFilterer.filterTargetIdGroupByProhibitedCombatantStates(
      party,
      allyAndOpponentIds[FriendOrFoe.Hostile],
      prohibitedStates,
      actionUser
    );

    const filteredNeutralIds = TargetFilterer.filterTargetIdGroupByProhibitedCombatantStates(
      party,
      allyAndOpponentIds[FriendOrFoe.Neutral],
      prohibitedStates,
      actionUser
    );

    return {
      [FriendOrFoe.Friendly]: filteredAllyIds,
      [FriendOrFoe.Hostile]: filteredOpponentIds,
      [FriendOrFoe.Neutral]: filteredNeutralIds,
    };
  }

  static filterTargetIdGroupByProhibitedCombatantStates(
    party: AdventuringParty,
    potentialIds: string[],
    prohibitedStates: ProhibitedTargetCombatantStates[],
    actionUser: IActionUser
  ) {
    const filteredIds = [];

    for (let targetId of potentialIds) {
      const combatantResult = party.combatantManager.getExpectedCombatant(targetId);
      let targetIsInProhibitedState = false;

      // handle webs/ensnares
      if (actionUser.getType() === ActionUserType.Combatant) {
        const { conditionManager } = actionUser.getCombatantProperties();

        const ensnaredConditionsWebCombatantIds = conditionManager
          .getConditions()
          .filter((condition) => condition.name === CombatantConditionName.Ensnared)
          .map((ensnaredCondition) => ensnaredCondition.appliedBy.entityProperties.id);

        if (ensnaredConditionsWebCombatantIds.length) {
          const targetIsSelf = targetId === actionUser.getEntityId();
          const targetIsPermittedWhenEnsnared =
            targetIsSelf || ensnaredConditionsWebCombatantIds.includes(targetId);

          if (!targetIsPermittedWhenEnsnared) {
            continue;
          }
        }
      }

      for (const combatantState of prohibitedStates) {
        targetIsInProhibitedState = PROHIBITED_TARGET_COMBATANT_STATE_CALCULATORS[combatantState](
          combatantResult,
          actionUser
        );
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
