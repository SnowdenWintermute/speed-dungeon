import { Combatant } from "../../../combatants/index.js";
import { EntityId } from "../../../primatives/index.js";
import { CombatAction } from "../../index.js";
import { AIBehaviorContext } from "../ai-context.js";
import { BehaviorLeaf, BehaviorNode, Sequence } from "../behavior-tree.js";

// get all actions that the user meets the cost requirements to perform and pass the provided condition (is healing, is damage)
// for each action, get the valid targets that exist
// - for each targeting scheme, iterate possibilities
// - check if action can be used on the target (if single is dead || all in group are dead && can't use on dead, don't add to list)
// set the action/targets pair as an option to consider

export class SetAvailableTargetsAndUsableActions implements BehaviorNode {
  constructor(
    private context: AIBehaviorContext,
    isUsableAction: (action: CombatAction) => boolean, // user has the resources to perform it
    isSuitableAction: (action: CombatAction) => boolean, // action would be desired for this type of behavior
    combatantIsValidTarget: (action: CombatAction, combatant: Combatant) => boolean // action can be used on this combatant
  ) {}
  execute(): boolean {
    return new Sequence([
      // collect a list of valid targets
      new BehaviorLeaf((context: AIBehaviorContext) => {
        const listOfAlliesBelowHpThreshold: EntityId[] = [];
        if (listOfAlliesBelowHpThreshold.length) {
          // set list in context
          return true;
        } else return false;
      }),
      // collect a list of valid actions
      new BehaviorLeaf((context: AIBehaviorContext) => {
        const listOfValidActions: CombatAction[] = [];
        if (listOfValidActions.length) {
          // set list in context
          return true;
        } else return false;
      }),
      // collect a list of usable actions
      new BehaviorLeaf((context: AIBehaviorContext) => {
        const listOfUsableHealingActions: CombatAction[] = [];
        if (listOfUsableHealingActions.length) {
          // set list in context
          return true;
        } else return false;
      }),
    ]).execute();
  }
}
