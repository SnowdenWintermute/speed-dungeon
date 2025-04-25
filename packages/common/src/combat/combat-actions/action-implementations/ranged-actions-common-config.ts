import { CombatActionRequiredRange } from "../combat-action-range.js";
import { RANGED_ACTION_DESTINATION_GETTERS } from "./ranged-action-destination-getters.js";

export const RANGED_ACTIONS_COMMON_CONFIG = {
  getRequiredRange: () => CombatActionRequiredRange.Ranged,
  motionPhasePositionGetters: RANGED_ACTION_DESTINATION_GETTERS,
};
