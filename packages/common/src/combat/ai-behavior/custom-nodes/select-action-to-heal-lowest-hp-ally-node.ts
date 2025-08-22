import { CombatAttribute } from "../../../combatants/attributes/index.js";
import { Combatant, CombatantProperties } from "../../../combatants/index.js";
import { NormalizedPercentage } from "../../../primatives/index.js";
import { CombatActionIntent } from "../../combat-actions/combat-action-intent.js";
import { CombatActionName } from "../../combat-actions/combat-action-names.js";
import { TargetCategories } from "../../combat-actions/targeting-schemes-and-categories.js";
import { AIBehaviorContext } from "../ai-context.js";
import {
  BEHAVIOR_NODE_STATE_STRINGS,
  BehaviorNode,
  BehaviorNodeState,
  PopFromStackNode,
  SequenceNode,
  SorterNode,
  UntilSuccessNode,
} from "../behavior-tree.js";
import { CollectPotentialTargetsForActionIfUsable } from "./add-to-considered-actions-with-targets-if-usable.js";
import { CollectAllOwnedActionsByIntent } from "./collect-all-owned-action-by-intent.js";
import { CollectConsideredCombatants } from "./collect-considered-combatants.js";
import { CollectPotentialHealingFromConsideredActions } from "./collect-potential-healing-from-considered-actions.js";
import { SelectActionExecutionIntent } from "./select-action-intent-node.js";
import { SetConsideredAction } from "./set-considered-action.js";

export class SelectActionToHealLowestHpAlly implements BehaviorNode {
  private root: BehaviorNode;
  constructor(
    private behaviorContext: AIBehaviorContext,
    private combatant: Combatant,
    private hitPointThresholdToWarrantHealing: NormalizedPercentage
  ) {
    this.root = new SequenceNode([
      // collect all allies that are "low" hp within a threshold
      new CollectConsideredCombatants(
        this.behaviorContext,
        this.combatant,
        TargetCategories.Friendly,
        (combatant) =>
          combatant.combatantProperties.hitPoints /
            CombatantProperties.getTotalAttributes(combatant.combatantProperties)[
              CombatAttribute.Hp
            ] <
          this.hitPointThresholdToWarrantHealing,
        this.behaviorContext.setConsideredCombatants
      ),
      // sort allies by lowest Hp
      new SorterNode(
        () => this.behaviorContext.consideredCombatants,
        (a, b) => a.combatantProperties.hitPoints - b.combatantProperties.hitPoints
      ),
      new CollectAllOwnedActionsByIntent(
        this.behaviorContext,
        this.combatant,
        // iterateNumericEnum(CombatActionIntent)
        [CombatActionIntent.Benevolent]
      ),

      // set a list of all valid action/target pairs
      new UntilSuccessNode(
        new SequenceNode([
          new PopFromStackNode(
            () => this.behaviorContext.consideredActionNamesFilteredByIntents,
            (actionName: CombatActionName) => {
              this.behaviorContext.setCurrentActionNameConsidering(actionName);

              // @TODO -actually select an actionLevel
              const actionLevel =
                this.combatant.combatantProperties.abilityProperties.ownedActions[actionName]
                  ?.level || 1;
              this.behaviorContext.setCurrentActionLevelConsidering(actionLevel);
            }
          ),
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
      // evaluate all valid actions for healing potential
      new CollectPotentialHealingFromConsideredActions(
        this.behaviorContext,
        this.combatant,
        (behaviorContext) => behaviorContext.consideredCombatants[0]
      ),
      // sort consideredActionIntents by evaluated healing potential
      // returns a negative value if the first argument is less than the second
      new SorterNode(
        () => this.behaviorContext.consideredActionIntents,
        (a, b) => {
          const scoreA = a.healingEvaluation.getScore();
          const scoreB = b.healingEvaluation.getScore();

          return scoreB - scoreA;
        }
      ),

      new SetConsideredAction(
        this.behaviorContext,
        () => this.behaviorContext.consideredActionIntents?.[0]?.intent.actionName,
        () => this.behaviorContext.getCurrentActionLevelConsidering()
      ),
      new SelectActionExecutionIntent(
        this.behaviorContext,
        this.combatant,
        () => this.behaviorContext.consideredActionIntents?.[0]?.intent.targets
      ),
    ]);
  }
  execute(): BehaviorNodeState {
    const status = this.root.execute();
    console.log("result of SelectActionToHealLowestHpAlly", BEHAVIOR_NODE_STATE_STRINGS[status]);
    return status;
  }
}
