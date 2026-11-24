import { IActionUser } from "../action-user-context/action-user.js";
import { CombatActionName } from "../combat/combat-actions/combat-action-names.js";
import { RandomNumberGenerator } from "../utility-classes/randomizers.js";

export interface ITurnDelayPolicy<ActionUser extends IActionUser> {
  computeTurnDelay: (actionUser: ActionUser) => number;
  computeDelayOnTurnEnded: (actionUser: ActionUser, actionName: CombatActionName) => number;
  computeDelayOnRegistered: (
    actionUser: ActionUser,
    timelineEntryIndex: number,
    rng: RandomNumberGenerator
  ) => number;
  computeBattleTimelineEntryCount: (actionUser: ActionUser) => number;
  // - if user is stopped, or not a tickable condition,
  //         it gets 0, otherwise reads the "extra battle timeline entry count" from combatant properties
}
