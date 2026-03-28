import { ERROR_MESSAGES } from "../../errors/index.js";
import { NextOrPrevious } from "../../primatives/index.js";
import { EntityId } from "../../aliases.js";
import { cycleListGivenCurrentValue } from "../../utils/index.js";
import { CombatActionComponent } from "../combat-actions/index.js";
import {
  FriendOrFoe,
  TargetCategories,
} from "../combat-actions/targeting-schemes-and-categories.js";
import { CombatActionTarget, CombatActionTargetType } from "./combat-action-targets.js";

// @REFACTOR
export default function getNextOrPreviousTarget(
  combatAction: CombatActionComponent,
  actionLevel: number,
  currentTargets: CombatActionTarget,
  direction: NextOrPrevious,
  validTargetIds: Record<FriendOrFoe, EntityId[]>
): CombatActionTarget {
  const allyIdsOption = validTargetIds[FriendOrFoe.Friendly];
  const opponentIdsOption = validTargetIds[FriendOrFoe.Hostile];
  const neutralIds = validTargetIds[FriendOrFoe.Neutral];

  let newTarget: Error | string = new Error("No target was calculated");
  switch (currentTargets.type) {
    case CombatActionTargetType.DistinctIds:
      throw new Error("user should not be selecting this targeting type");
    case CombatActionTargetType.SingleAndSides:
    case CombatActionTargetType.Sides:
    case CombatActionTargetType.Single:
      switch (combatAction.targetingProperties.getValidTargetCategories(actionLevel)) {
        case TargetCategories.Opponent:
          if (!opponentIdsOption) throw new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NO_VALID_TARGETS);
          newTarget = cycleListGivenCurrentValue(
            [...opponentIdsOption, ...neutralIds],
            currentTargets.targetId,
            direction
          );
          return {
            type: currentTargets.type,
            targetId: newTarget,
          };
        case TargetCategories.User:
          return currentTargets;
        case TargetCategories.Friendly:
          if (!allyIdsOption) throw new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NO_VALID_TARGETS);
          newTarget = cycleListGivenCurrentValue(
            [...allyIdsOption, ...neutralIds],
            currentTargets.targetId,
            direction
          );
          return {
            type: currentTargets.type,
            targetId: newTarget,
          };
        case TargetCategories.Any:
          const possibleTargetIds: string[] = [
            ...opponentIdsOption,
            ...allyIdsOption,
            ...neutralIds,
          ];
          newTarget = cycleListGivenCurrentValue(
            possibleTargetIds,
            currentTargets.targetId,
            direction
          );
          return {
            type: currentTargets.type,
            targetId: newTarget,
          };
      }
    case CombatActionTargetType.Group:
      switch (combatAction.targetingProperties.getValidTargetCategories(actionLevel)) {
        case TargetCategories.Opponent:
          return {
            type: CombatActionTargetType.Group,
            friendOrFoe: FriendOrFoe.Hostile,
          };
        case TargetCategories.User:
          return currentTargets;
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
