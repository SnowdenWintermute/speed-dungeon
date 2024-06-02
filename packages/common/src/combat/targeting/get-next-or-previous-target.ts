import { FriendOrFoe, TargetCategories } from "..";
import { ERROR_MESSAGES } from "../../errors";
import { NextOrPrevious } from "../../primatives";
import { CombatActionProperties } from "../combat-actions";
import { CombatActionTarget, CombatActionTargetType } from "./combat-action-targets";

export default function getNextOrPreviousTarget(
  combatActionProperties: CombatActionProperties,
  currentTargets: CombatActionTarget,
  direction: NextOrPrevious,
  actionUserId: string,
  allyIdsOption: null | string[],
  opponentIdsOption: null | string[]
): Error | CombatActionTarget {
  switch (currentTargets.type) {
    case CombatActionTargetType.Single:
      switch (combatActionProperties.validTargetCategories) {
        case TargetCategories.Opponent:
          if (!opponentIdsOption) return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NO_VALID_TARGETS);
          return {
            type: CombatActionTargetType.Single,
            targetId: getNextOrPrevIdFromOrderedList(
              opponentIdsOption,
              currentTargets.targetId,
              direction
            ),
          };
        case TargetCategories.User:
          return {
            type: CombatActionTargetType.Single,
            targetId: actionUserId,
          };
        case TargetCategories.Friendly:
          if (!allyIdsOption) return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NO_VALID_TARGETS);
          return {
            type: CombatActionTargetType.Single,
            targetId: getNextOrPrevIdFromOrderedList(
              allyIdsOption,
              currentTargets.targetId,
              direction
            ),
          };
        case TargetCategories.Any:
          const possibleTargetIds: string[] = [];
          if (opponentIdsOption) possibleTargetIds.push.apply(opponentIdsOption);
          if (allyIdsOption) possibleTargetIds.push.apply(allyIdsOption);
          return {
            type: CombatActionTargetType.Single,
            targetId: getNextOrPrevIdFromOrderedList(
              possibleTargetIds,
              currentTargets.targetId,
              direction
            ),
          };
      }
    case CombatActionTargetType.Group:
      switch (combatActionProperties.validTargetCategories) {
        case TargetCategories.Opponent:
          return {
            type: CombatActionTargetType.Group,
            friendOrFoe: FriendOrFoe.Hostile,
          };
        case TargetCategories.User:
          return {
            type: CombatActionTargetType.Single,
            targetId: actionUserId,
          };
        case TargetCategories.Friendly:
          return {
            type: CombatActionTargetType.Group,
            friendOrFoe: FriendOrFoe.Friendly,
          };
        case TargetCategories.Any:
          switch (currentTargets.friendOrFoe) {
            case FriendOrFoe.Friendly:
              return {
                type: CombatActionTargetType.Group,
                friendOrFoe: FriendOrFoe.Hostile,
              };
            case FriendOrFoe.Hostile:
              return {
                type: CombatActionTargetType.Group,
                friendOrFoe: FriendOrFoe.Friendly,
              };
          }
      }
    case CombatActionTargetType.All:
      return {
        type: CombatActionTargetType.All,
      };
  }
}

function getNextOrPrevIdFromOrderedList(
  possibleTargetIds: string[],
  currentTargetId: string,
  direction: NextOrPrevious
) {
  const currentPositionIndex = possibleTargetIds.indexOf(currentTargetId);
  let newIndex;
  switch (direction) {
    case NextOrPrevious.Next:
      if (currentPositionIndex < possibleTargetIds.length) newIndex = currentPositionIndex + 1;
      else newIndex = 0;
    case NextOrPrevious.Previous:
      if (currentPositionIndex > 0) newIndex = currentPositionIndex - 1;
      else newIndex = possibleTargetIds.length;
  }
  return possibleTargetIds[newIndex]!;
}
