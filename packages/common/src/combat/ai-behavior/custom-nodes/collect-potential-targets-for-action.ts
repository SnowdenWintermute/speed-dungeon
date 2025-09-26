import cloneDeep from "lodash.clonedeep";
import { Combatant } from "../../../combatants/index.js";
import { NextOrPrevious } from "../../../primatives/index.js";
import { COMBAT_ACTIONS } from "../../combat-actions/action-implementations/index.js";
import { CombatActionName } from "../../combat-actions/combat-action-names.js";
import { CombatActionTarget } from "../../targeting/combat-action-targets.js";
import { TargetingCalculator } from "../../targeting/targeting-calculator.js";
import { AIBehaviorContext } from "../ai-context.js";
import { BehaviorNode, BehaviorNodeState } from "../behavior-tree.js";
import { ActionAndRank } from "../../../action-user-context/action-user-targeting-properties.js";

export class CollectPotentialTargetsForAction implements BehaviorNode {
  constructor(
    private behaviorContext: AIBehaviorContext,
    private combatant: Combatant,
    private actionNameOption: null | CombatActionName,
    private actionLevel: number
  ) {}
  execute(): BehaviorNodeState {
    const actionNameOption = this.actionNameOption;

    if (actionNameOption === null) {
      return BehaviorNodeState.Failure;
    }

    const action = COMBAT_ACTIONS[actionNameOption];

    // combatantProperties.selectedCombatAction = actionNameOption;
    const targetingProperties = this.combatant.getTargetingProperties();
    const actionAndRank = new ActionAndRank(actionNameOption, this.actionLevel);
    targetingProperties.setSelectedActionAndRank(actionAndRank);

    const targetingCalculator = new TargetingCalculator(
      this.behaviorContext.actionUserContext,
      null
    );

    // must set it as selected since targetingCalculator will look for it
    const initialTargetsResult =
      targetingProperties.assignInitialTargetsForSelectedAction(targetingCalculator);
    if (initialTargetsResult instanceof Error) {
      console.error(initialTargetsResult);
      return BehaviorNodeState.Failure;
    }

    const targetOptions: CombatActionTarget[] = [];
    const targetOptionsAsStrings: string[] = [];

    const targetingSchemeOptions = [
      ...action.targetingProperties.getTargetingSchemes(this.actionLevel),
    ];

    const validTargetsByDisposition =
      targetingCalculator.getFilteredPotentialTargetIdsForAction(actionAndRank);

    for (const currentTargetingSchemeIndex of targetingSchemeOptions) {
      let currentOption = targetingProperties.cycleTargets(
        NextOrPrevious.Next,
        null,
        validTargetsByDisposition
      );

      while (!targetOptionsAsStrings.includes(JSON.stringify(currentOption))) {
        targetOptions.push(currentOption);
        targetOptionsAsStrings.push(JSON.stringify(currentOption));

        currentOption = targetingProperties.cycleTargets(
          NextOrPrevious.Next,
          null,
          validTargetsByDisposition
        );
      }

      targetingProperties.cycleTargetingSchemes(targetingCalculator);

      const selectedTarget = targetingProperties.getSelectedTarget();
      if (selectedTarget !== null) currentOption = cloneDeep(selectedTarget);
    }

    this.behaviorContext.usableActionsWithPotentialValidTargets[actionNameOption] = targetOptions;

    return BehaviorNodeState.Success;
  }
}
