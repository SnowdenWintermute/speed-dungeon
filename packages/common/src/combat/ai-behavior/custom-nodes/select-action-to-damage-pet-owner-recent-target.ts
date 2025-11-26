import { Combatant } from "../../../combatants/index.js";
import { COMBAT_ACTIONS } from "../../combat-actions/action-implementations/index.js";
import { CombatActionIntent } from "../../combat-actions/combat-action-intent.js";
import { CombatActionName } from "../../combat-actions/combat-action-names.js";
import { TargetCategories } from "../../combat-actions/targeting-schemes-and-categories.js";
import { TargetingCalculator } from "../../targeting/targeting-calculator.js";
import { AIBehaviorContext } from "../ai-context.js";
import {
  BehaviorNode,
  BehaviorNodeState,
  PopFromStackNode,
  RandomizerNode,
  SequenceNode,
  SorterNode,
  UntilSuccessNode,
} from "../behavior-tree.js";
import { CollectPotentialTargetsForActionIfUsable } from "./add-to-considered-actions-with-targets-if-usable.js";
import { CollectAllOwnedActionsByIntent } from "./collect-all-owned-action-by-intent.js";
import { CollectConsideredCombatants } from "./collect-considered-combatants.js";
import { SelectActionExecutionIntent } from "./select-action-intent-node.js";
import { SetConsideredAction } from "./set-considered-action.js";

export class SelectActionToTargetPetOwnerMostRecentTarget implements BehaviorNode {
  private root: BehaviorNode;
  constructor(
    private behaviorContext: AIBehaviorContext,
    private combatant: Combatant
  ) {
    this.root = new SequenceNode([
      // consider only targets that this pet's owner was recently targeting
      new CollectConsideredCombatants(
        this.behaviorContext,
        this.combatant,
        TargetCategories.Opponent,
        (targetCombatant) => {
          const { party, actionUser } = behaviorContext.actionUserContext;
          // get owner of this action user
          const { controlledBy } = actionUser.getCombatantProperties();
          const summonedByCombatant = controlledBy.getExpectedSummonedByCombatant(party);

          // get most recent targets of owner
          const ownerTargetOption = summonedByCombatant
            .getTargetingProperties()
            .getMostRecentActionExecutionIntentOption();

          // if there is no recent target, all targets are viable options
          if (ownerTargetOption === null) {
            return true;
          } else {
            // check if this combatant is on the list of owner's most recent targets
            // @PERF - recreating a new targetingCalculator here could be moved to a singleton
            // and just modified here
            const targetingCalculator = new TargetingCalculator(
              this.behaviorContext.actionUserContext,
              null
            );
            const targetIds = targetingCalculator.getCombatActionTargetIds(
              COMBAT_ACTIONS[ownerTargetOption.actionName],
              ownerTargetOption.targets
            );

            if (targetIds instanceof Error) {
              console.error(targetIds);
              return false;
            }

            return targetIds.includes(targetCombatant.getEntityId());
          }
        },
        this.behaviorContext.setConsideredCombatants
      ),
      // sort potential targets by lowest Hp
      new SorterNode(
        () => this.behaviorContext.consideredCombatants,
        (a, b) =>
          a.combatantProperties.resources.getHitPoints() -
          b.combatantProperties.resources.getHitPoints()
      ),
      new CollectAllOwnedActionsByIntent(
        this.behaviorContext,
        this.combatant,
        // iterateNumericEnum(CombatActionIntent)
        [CombatActionIntent.Malicious]
      ),

      new RandomizerNode(() => this.behaviorContext.consideredActionNamesFilteredByIntents),
      new UntilSuccessNode(
        new SequenceNode([
          new PopFromStackNode(
            () => this.behaviorContext.consideredActionNamesFilteredByIntents,
            (actionName: CombatActionName) => {
              this.behaviorContext.setCurrentActionNameConsidering(actionName);

              // one day we should choose the action rank somehow instead of max only
              const maxActionRank =
                this.combatant.combatantProperties.abilityProperties.getOwnedActionOption(
                  actionName
                )?.level || 1;

              this.behaviorContext.setCurrentActionLevelConsidering(maxActionRank);
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
    return status;
  }
}
