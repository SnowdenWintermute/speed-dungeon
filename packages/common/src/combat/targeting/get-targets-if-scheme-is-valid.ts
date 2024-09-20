import { FriendOrFoe, TargetingScheme } from "../index.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { CombatActionTarget, CombatActionTargetType } from "./combat-action-targets.js";

const INVALID_TARGETING_SCHEME_ERROR = new Error(
  ERROR_MESSAGES.COMBAT_ACTIONS.INVALID_TARGETS_SELECTED
);

export default function getActionTargetsIfSchemeIsValid(
  actionTarget: CombatActionTarget,
  allyIds: string[],
  opponentIdsOption: null | string[],
  excludedSchemes: TargetingScheme[]
): Error | string[] {
  switch (actionTarget.type) {
    case CombatActionTargetType.Single:
      if (excludedSchemes.includes(TargetingScheme.Single)) return INVALID_TARGETING_SCHEME_ERROR;
      return [actionTarget.targetId];
    case CombatActionTargetType.Group:
      if (excludedSchemes.includes(TargetingScheme.Area)) return INVALID_TARGETING_SCHEME_ERROR;
      if (actionTarget.friendOrFoe === FriendOrFoe.Friendly) return allyIds;
      else if (opponentIdsOption === null) return INVALID_TARGETING_SCHEME_ERROR;
      else return opponentIdsOption;
    case CombatActionTargetType.All:
      if (excludedSchemes.includes(TargetingScheme.All)) return INVALID_TARGETING_SCHEME_ERROR;
      const opponentIds = opponentIdsOption || [];
      const allCombatantIds = allyIds.concat(opponentIds);
      return allCombatantIds;
  }
}
