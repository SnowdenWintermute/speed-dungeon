import { ERROR_MESSAGES } from "../../errors/index.js";
import { EntityId } from "../../primatives/index.js";
import { FriendOrFoe } from "../combat-actions/targeting-schemes-and-categories.js";
import { CombatActionTarget, CombatActionTargetType } from "./combat-action-targets.js";

const INVALID_TARGETING_SCHEME_ERROR = new Error(
  ERROR_MESSAGES.COMBAT_ACTIONS.INVALID_TARGETS_SELECTED
);

export function getActionTargetsIfSchemeIsValid(
  actionTarget: CombatActionTarget,
  allyIds: EntityId[],
  opponentIdsOption: null | EntityId[]
): Error | EntityId[] {
  switch (actionTarget.type) {
    case CombatActionTargetType.Single:
      return [actionTarget.targetId as EntityId];
    case CombatActionTargetType.SingleAndSides:
      const targetIds = [actionTarget.targetId as EntityId];
      allyIds.forEach((id, i) => {
        if (id === actionTarget.targetId) {
          const prevOption = allyIds[i - 1];
          const nextOption = allyIds[i + 1];
          if (prevOption !== undefined) targetIds.push(prevOption);
          if (nextOption !== undefined) targetIds.push(nextOption);
        }
      });
      if (opponentIdsOption)
        opponentIdsOption.forEach((id, i) => {
          if (id === actionTarget.targetId) {
            const prevOption: EntityId | undefined = opponentIdsOption[i - 1];
            const nextOption: EntityId | undefined = opponentIdsOption[i + 1];
            if (prevOption !== undefined) targetIds.push(prevOption as EntityId);
            if (nextOption !== undefined) targetIds.push(nextOption as EntityId);
          }
        });
      return targetIds as EntityId[];

    case CombatActionTargetType.Group:
      if (actionTarget.friendOrFoe === FriendOrFoe.Friendly) return allyIds;
      else if (opponentIdsOption === null) return INVALID_TARGETING_SCHEME_ERROR;
      else return opponentIdsOption;
    case CombatActionTargetType.All:
      const opponentIds: EntityId[] = opponentIdsOption || [];
      const allCombatantIds: EntityId[] = allyIds.concat(opponentIds);
      return allCombatantIds;
  }
}
