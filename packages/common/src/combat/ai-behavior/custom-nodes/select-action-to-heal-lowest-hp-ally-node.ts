import { CombatAttribute } from "../../../combatants/attributes/index.js";
import { Combatant, CombatantProperties } from "../../../combatants/index.js";
import { NormalizedPercentage } from "../../../primatives/index.js";
import { iterateNumericEnum } from "../../../utils/index.js";
import { CombatActionIntent } from "../../combat-actions/combat-action-intent.js";
import { CombatActionName } from "../../combat-actions/combat-action-names.js";
import { TargetCategories } from "../../combat-actions/targeting-schemes-and-categories.js";
import { AIBehaviorContext } from "../ai-context.js";
import {
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
          this.hitPointThresholdToWarrantHealing
      ),
      // sort allies by lowest Hp
      new SorterNode(
        this.behaviorContext.getConsideredCombatants,
        (a, b) => b.combatantProperties.hitPoints - a.combatantProperties.hitPoints
      ),
      new CollectAllOwnedActionsByIntent(
        this.behaviorContext,
        this.combatant,
        iterateNumericEnum(CombatActionIntent)
      ),

      new UntilSuccessNode(
        new SequenceNode([
          // build a list of action/target pairs along with their average/max healing on target, cost/avg healing,
          // and avg healing on all allies as well as cost/avg healing on all allies
          new PopFromStackNode(
            () => this.behaviorContext.consideredActionNamesFilteredByIntents,
            (actionName: CombatActionName) =>
              this.behaviorContext.setCurrentActionNameConsidering(actionName)
          ),
          // check if action is useable
          new CollectPotentialTargetsForActionIfUsable(this.behaviorContext, this.combatant, () =>
            this.behaviorContext.getCurrentActionNameConsidering()
          ),
          // record this action's avg, max and per/mp healing on the target and total on the team
        ]),
        {
          maxAttemptsGetter: () =>
            this.behaviorContext.consideredActionNamesFilteredByIntents.length,
        }
      ),
      // for each ally
      // - sort action/target pairs by
      //   - the actions that could fully heal the target given max roll
      //   - if no full heal available: highest healing available given average roll
      //   - if multiple full heals: lowest price per effective (not overhealed) hp restored if rolling the average
      // - also record the "total ally hp healed" for these actions
      // - considered "total ally hp healed" and its extra cost vs current MP
      //

      // new SelectActionExecutionIntent(
      //   this.behaviorContext,
      //   this.combatant,
      //   () => this.behaviorContext.selectedActionWithPotentialValidTargets?.potentialValidTargets[0]
      // ),
    ]);
  }
  execute(): BehaviorNodeState {
    return this.root.execute();
  }
}
