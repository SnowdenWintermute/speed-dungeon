import { IActionUser } from "../../action-user-context/action-user.js";
import { CombatActionName } from "../../combat/combat-actions/combat-action-names.js";
import { RandomNumberGenerator } from "../../utility-classes/randomizers.js";

export interface ITurnDelayPolicy<ActionUser extends IActionUser> {
  computeBaseTurnDelay: (actionUser: ActionUser) => number;
  computeDelayOnTurnEnded: (actionUser: ActionUser, actionName: CombatActionName) => number;
  computeDelayOnRegistered: (
    actionUser: ActionUser,
    timelineEntryIndex: number,
    rng: RandomNumberGenerator
  ) => number;
  computeBattleTimelineEntryCount: (actionUser: ActionUser) => number;
}
