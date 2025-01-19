import { ERROR_MESSAGES } from "../../errors/index.js";
import { FriendOrFoe } from "../combat-actions/targeting-schemes-and-categories.js";
import { CombatActionTarget, CombatActionTargetType } from "./combat-action-targets.js";

const INVALID_TARGETING_SCHEME_ERROR = new Error(
  ERROR_MESSAGES.COMBAT_ACTIONS.INVALID_TARGETS_SELECTED
);

export default function getActionTargetsIfSchemeIsValid(
  actionTarget: CombatActionTarget,
  allyIds: string[],
  opponentIdsOption: null | string[]
): Error | string[] {
  switch (actionTarget.type) {
    case CombatActionTargetType.Single:
      return [actionTarget.targetId];
    case CombatActionTargetType.Group:
      if (actionTarget.friendOrFoe === FriendOrFoe.Friendly) return allyIds;
      else if (opponentIdsOption === null) return INVALID_TARGETING_SCHEME_ERROR;
      else return opponentIdsOption;
    case CombatActionTargetType.All:
      const opponentIds = opponentIdsOption || [];
      const allCombatantIds = allyIds.concat(opponentIds);
      return allCombatantIds;
  }
}
