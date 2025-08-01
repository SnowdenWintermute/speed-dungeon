import { CombatAttribute } from "../../../combatants/attributes/index.js";
import { Combatant, CombatantProperties } from "../../../combatants/index.js";
import { NormalizedPercentage } from "../../../primatives/index.js";
import { iterateNumericEnum } from "../../../utils/index.js";
import { CombatActionIntent } from "../../combat-actions/combat-action-intent.js";
import { TargetCategories } from "../../combat-actions/targeting-schemes-and-categories.js";
import { CombatActionTarget } from "../../targeting/combat-action-targets.js";
import { AIBehaviorContext } from "../ai-context.js";
import { BehaviorNode, BehaviorNodeState, SequenceNode, SorterNode } from "../behavior-tree.js";
import { CollectAllOwnedActionsByIntent } from "./collect-all-owned-action-by-intent.js";
import { CollectConsideredCombatants } from "./collect-considered-combatants.js";

// Before executing this tree, if the combined expected average damage of
// the AI's sequential turns, accounting for forced aggro targets, can wipe the player party, do that instead
//
// Healing Action and Target Selection
// - Determine average expected damage output of player party
// before the next AI healer's turn, based off of:
//   - Simple/Omniscient - all known stats and actions of enemy combatants
//   - Observed damage done so far in the battle by player characters
//   - If the AI is "Good at assessment", player character's stats and
//     - known actions taken OR
//     - common actions that the player's class would have
// - Collect allies by risk status
//   - Emergency (could be killed by expected damage)
//   - MaintenanceOpportunity (missing some HP, but has enough HP and defenses to survive until healer's next turn)
//   - Unbothered
// - For targets at Emergency status
//   - Sort by
//      - "Is savable" (do we own an action that can remove them from Emergency status)
//      - "how much we want this ally to live"
//      - lowest HP
//   - Collect usable actions
//   - Collect actions which could bring their HP out of Emergency status
//   - If no damaging actions are owned, and no MaintenanceOpportunity targets exist, or
//     "try your best to save them mode " is active,
//     also collect actions which have any healing effect even if it won't
//     heal enough to save them. Otherwise we should fail here and just damage
//     the enemy team or try to heal up a healthier target.
//   - Sort collected actions by
//       - Healing done to primary target
//       - Healing done to entire team
//       - Resource cost of action

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
      // for each ally
      // - sort action/target pairs by
      //   - the actions that will fully heal the target
      //   - if multiple full heals: lowest price per effective (not overhealed) hp restored
      //   - if no full heal available: highest healing available
      // - also record the "total ally hp healed" for these actions
      // - considered "total ally hp healed" and its extra cost vs current MP
      //

      new CollectAllOwnedActionsByIntent(
        this.behaviorContext,
        this.combatant,
        iterateNumericEnum(CombatActionIntent)
      ),

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

export class FilterSelectedActionPotentialTargets implements BehaviorNode {
  constructor(
    private behaviorContext: AIBehaviorContext,
    private combatant: Combatant,
    private filteringFunction: (
      target: CombatActionTarget,
      behaviorContext: AIBehaviorContext
    ) => boolean
  ) {}
  execute(): BehaviorNodeState {
    const actionNameOption = this.behaviorContext.currentActionNameConsidering;
    if (actionNameOption === null) return BehaviorNodeState.Failure;

    const potentialValidTargets =
      this.behaviorContext.usableActionsWithPotentialValidTargets[actionNameOption];

    if (potentialValidTargets === undefined) {
      throw new Error(
        "expected usableActionsWithPotentialValidTargets to contain the action name passed to this node"
      );
    }

    const filteredTargets = potentialValidTargets.filter((target) =>
      this.filteringFunction(target, this.behaviorContext)
    );

    if (filteredTargets.length === 0) return BehaviorNodeState.Failure;

    this.behaviorContext.selectedActionWithPotentialValidTargets = {
      actionName: actionNameOption,
      potentialValidTargets: filteredTargets,
    };

    return BehaviorNodeState.Success;
  }
}
