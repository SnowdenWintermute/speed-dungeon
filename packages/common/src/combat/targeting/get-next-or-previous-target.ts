import { ERROR_MESSAGES } from "../../errors/index.js";
import { NextOrPrevious } from "../../primatives/index.js";
import { CombatActionComponent } from "../combat-actions/index.js";
import {
  FriendOrFoe,
  TargetCategories,
} from "../combat-actions/targeting-schemes-and-categories.js";
import { CombatActionTarget, CombatActionTargetType } from "./combat-action-targets.js";

export default function getNextOrPreviousTarget(
  combatAction: CombatActionComponent,
  currentTargets: CombatActionTarget,
  direction: NextOrPrevious,
  actionUserId: string,
  allyIdsOption: null | string[],
  opponentIdsOption: null | string[]
): Error | CombatActionTarget {
  let newTargetResult: Error | string = new Error("No target was calculated");
  switch (currentTargets.type) {
    case CombatActionTargetType.SingleAndSides:
    case CombatActionTargetType.Sides:
    case CombatActionTargetType.Single:
      switch (combatAction.targetingProperties.validTargetCategories) {
        case TargetCategories.Opponent:
          if (!opponentIdsOption) return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NO_VALID_TARGETS);
          newTargetResult = getNextOrPrevIdFromOrderedList(
            opponentIdsOption,
            currentTargets.targetId,
            direction
          );
          if (newTargetResult instanceof Error) return newTargetResult;
          return {
            type: currentTargets.type,
            targetId: newTargetResult,
          };
        case TargetCategories.User:
          return {
            type: currentTargets.type,
            targetId: actionUserId,
          };
        case TargetCategories.Friendly:
          if (!allyIdsOption) return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NO_VALID_TARGETS);
          newTargetResult = getNextOrPrevIdFromOrderedList(
            allyIdsOption,
            currentTargets.targetId,
            direction
          );
          if (newTargetResult instanceof Error) return newTargetResult;
          return {
            type: currentTargets.type,
            targetId: newTargetResult,
          };
        case TargetCategories.Any:
          const possibleTargetIds: string[] = [];
          if (opponentIdsOption) possibleTargetIds.push(...opponentIdsOption);
          if (allyIdsOption) possibleTargetIds.push(...allyIdsOption);
          newTargetResult = getNextOrPrevIdFromOrderedList(
            possibleTargetIds,
            currentTargets.targetId,
            direction
          );
          if (newTargetResult instanceof Error) return newTargetResult;
          return {
            type: currentTargets.type,
            targetId: newTargetResult,
          };
      }
    case CombatActionTargetType.Group:
      switch (combatAction.targetingProperties.validTargetCategories) {
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
          if (!opponentIdsOption || !opponentIdsOption.length) {
            return {
              type: CombatActionTargetType.Group,
              friendOrFoe: FriendOrFoe.Friendly,
            };
          }
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
): Error | string {
  let currentPositionIndex = possibleTargetIds.indexOf(currentTargetId);
  if (currentPositionIndex === -1)
    return new Error("Tried to get next target but wasn't targeting anything in the provided list");
  if (possibleTargetIds.length < 1) return new Error("Tried to get next target in an empty list");

  let newIndex;
  switch (direction) {
    case NextOrPrevious.Next:
      if (currentPositionIndex < possibleTargetIds.length - 1) newIndex = currentPositionIndex + 1;
      else newIndex = 0;
      break;
    case NextOrPrevious.Previous:
      if (currentPositionIndex > 0) newIndex = currentPositionIndex - 1;
      else newIndex = possibleTargetIds.length - 1;
  }

  const newTarget = possibleTargetIds[newIndex];

  if (newTarget === undefined) return new Error("Target not found in list");
  else return newTarget;
}
