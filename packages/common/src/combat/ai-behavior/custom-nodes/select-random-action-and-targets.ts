import { Combatant } from "../../../combatants/index.js";
import { CombatActionIntent, CombatActionName } from "../../combat-actions/index.js";
import { AIBehaviorContext } from "../ai-context.js";
import {
  BehaviorNode,
  BehaviorNodeState,
  PopFromStackNode,
  RandomizerNode,
  SequenceNode,
  UntilSuccessNode,
} from "../behavior-tree.js";
import { CollectPotentialTargetsForActionIfUsable } from "./add-to-considered-actions-with-targets-if-usable.js";
import { CollectAllOwnedActionsByIntent } from "./collect-all-owned-action-by-intent.js";
import { SelectActionExecutionIntent } from "./select-action-intent-node.js";
import { SelectActionWithPotentialTargets } from "./select-action-with-potential-targets-node.js";

export class SelectRandomActionAndTargets implements BehaviorNode {
  private root: BehaviorNode;
  constructor(
    private behaviorContext: AIBehaviorContext,
    private combatant: Combatant,
    private permittedIntents: CombatActionIntent[]
  ) {
    this.root = new SequenceNode([
      new CollectAllOwnedActionsByIntent(
        this.behaviorContext,
        this.combatant,
        this.permittedIntents
      ),
      // randomize the possible actions now so we don't calculate all the conditional
      // stuff for each one, just the first random one
      new RandomizerNode(() => this.behaviorContext.consideredActionNamesFilteredByIntents),
      new UntilSuccessNode(
        new SequenceNode([
          // pop from stack next possible action
          new PopFromStackNode(
            () => this.behaviorContext.consideredActionNamesFilteredByIntents,
            (actionName: CombatActionName) => {
              this.behaviorContext.setCurrentActionNameConsidering(actionName);
              // @TODO -actually select an actionLevel
              const actionLevel =
                this.combatant.combatantProperties.abilityProperties.getOwnedActionOption(
                  actionName
                )?.level || 1;
              this.behaviorContext.setCurrentActionLevelConsidering(actionLevel);
            }
          ),
          // check if action is useable
          new CollectPotentialTargetsForActionIfUsable(
            this.behaviorContext,
            this.combatant,
            () => this.behaviorContext.getCurrentActionNameConsidering(),
            () => this.behaviorContext.getCurrentActionLevelConsidering()
          ),
        ]),
        {
          maxAttemptsGetter: () =>
            this.behaviorContext.consideredActionNamesFilteredByIntents.length,
        }
      ),
      // the name we're considering should be the one we just picked as the first
      // in the random list of actions that passed all the previous checks
      new SelectActionWithPotentialTargets(this.behaviorContext, this.combatant),
      new RandomizerNode(
        () => this.behaviorContext.selectedActionWithPotentialValidTargets?.potentialValidTargets
      ),
      new SelectActionExecutionIntent(
        this.behaviorContext,
        this.combatant,
        () => this.behaviorContext.selectedActionWithPotentialValidTargets?.potentialValidTargets[0]
      ),
    ]);
  }
  execute(): BehaviorNodeState {
    return this.root.execute();
  }
}
