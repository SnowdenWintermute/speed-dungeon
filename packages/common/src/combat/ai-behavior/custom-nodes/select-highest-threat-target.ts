import { Combatant } from "../../../combatants/index.js";
import { COMBAT_ACTIONS } from "../../combat-actions/action-implementations/index.js";
import { CombatActionIntent } from "../../combat-actions/combat-action-intent.js";
import {
  COMBAT_ACTION_NAME_STRINGS,
  CombatActionName,
} from "../../combat-actions/combat-action-names.js";
import { TargetingCalculator } from "../../targeting/targeting-calculator.js";
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
import { FilterSelectedActionPotentialTargets } from "./filter-selected-action-potential-targets.js";
import { SelectActionExecutionIntent } from "./select-action-intent-node.js";
import { SelectActionWithPotentialTargets } from "./select-action-with-potential-targets-node.js";

export class SelectTopThreatTargetAndAction implements BehaviorNode {
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
              console.log("popped considered action name:", COMBAT_ACTION_NAME_STRINGS[actionName]);
              this.behaviorContext.setCurrentActionNameConsidering(actionName);
              // @TODO -actually select an actionLevel
              const actionLevel =
                this.combatant.combatantProperties.ownedActions[actionName]?.level || 1;
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
          new SelectActionWithPotentialTargets(this.behaviorContext, this.combatant),
          // filter selectedActionWithPotentialValidTargets targets by those that include top threat
          new FilterSelectedActionPotentialTargets(
            this.behaviorContext,
            this.combatant,
            (target, behaviorContext) => {
              const { threatManager } = this.combatant.combatantProperties;
              if (threatManager === undefined) return true;
              const topThreatTarget = threatManager.getHighestThreatCombatantId();
              if (topThreatTarget === null) return true;
              const { selectedActionWithPotentialValidTargets } = this.behaviorContext;
              if (selectedActionWithPotentialValidTargets === null)
                throw new Error("expected to have an action selected");
              const { actionName } = selectedActionWithPotentialValidTargets;

              const targetingCalculator = new TargetingCalculator(
                behaviorContext.combatantContext,
                null
              );
              const targetIdsResult = targetingCalculator.getCombatActionTargetIds(
                COMBAT_ACTIONS[actionName],
                target
              );
              if (targetIdsResult instanceof Error) throw targetIdsResult;
              if (targetIdsResult.includes(topThreatTarget)) return true;

              return false;
            }
          ),
        ]),
        {
          maxAttemptsGetter: () =>
            this.behaviorContext.consideredActionNamesFilteredByIntents.length,
        }
      ),

      // if more than one target option targets the highest threat, then we can randomize the options
      new RandomizerNode(
        () => this.behaviorContext.selectedActionWithPotentialValidTargets?.potentialValidTargets
      ),
      // now the potentialValidTargets[0] should be the one that remains
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
