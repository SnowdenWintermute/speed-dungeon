import cloneDeep from "lodash.clonedeep";
import { Combatant } from "../../../combatants/index.js";
import { NextOrPrevious } from "../../../primatives/index.js";
import { throwIfError } from "../../../utils/index.js";
import { COMBAT_ACTIONS } from "../../combat-actions/action-implementations/index.js";
import {
  COMBAT_ACTION_NAME_STRINGS,
  CombatActionName,
} from "../../combat-actions/combat-action-names.js";
import { CombatActionTarget } from "../../targeting/combat-action-targets.js";
import { TargetingCalculator } from "../../targeting/targeting-calculator.js";
import { AIBehaviorContext } from "../ai-context.js";
import { BehaviorNode, BehaviorNodeState } from "../behavior-tree.js";

export class CollectPotentialTargetsForAction implements BehaviorNode {
  constructor(
    private behaviorContext: AIBehaviorContext,
    private combatant: Combatant,
    private actionNameOption: null | CombatActionName,
    private actionLevel: number
  ) {}
  execute(): BehaviorNodeState {
    const actionNameOption = this.actionNameOption;

    if (actionNameOption === null) return BehaviorNodeState.Failure;

    const { entityProperties, combatantProperties } = this.combatant;
    const action = COMBAT_ACTIONS[actionNameOption];

    // combatantProperties.selectedCombatAction = actionNameOption;
    combatantProperties.selectedActionLevel = this.actionLevel;

    const targetingCalculator = new TargetingCalculator(
      this.behaviorContext.combatantContext,
      null
    );

    // must set it as selected since targetingCalculator will look for it
    const initialTargetsResult = targetingCalculator.assignInitialCombatantActionTargets(action);
    if (initialTargetsResult instanceof Error) {
      console.error(initialTargetsResult);
      return BehaviorNodeState.Failure;
    }

    const targetOptions: CombatActionTarget[] = [];
    const targetOptionsAsStrings: string[] = [];

    const targetingSchemeOptions = [
      ...action.targetingProperties.getTargetingSchemes(this.actionLevel),
    ];

    for (const currentTargetingSchemeIndex of targetingSchemeOptions) {
      let currentOption = throwIfError(
        targetingCalculator.cycleCharacterTargets(entityProperties.id, NextOrPrevious.Next)
      );

      while (!targetOptionsAsStrings.includes(JSON.stringify(currentOption))) {
        targetOptions.push(currentOption);
        targetOptionsAsStrings.push(JSON.stringify(currentOption));

        currentOption = throwIfError(
          targetingCalculator.cycleCharacterTargets(entityProperties.id, NextOrPrevious.Next)
        );
      }

      targetingCalculator.cycleCharacterTargetingSchemes(entityProperties.id);

      if (combatantProperties.combatActionTarget !== null)
        currentOption = cloneDeep(combatantProperties.combatActionTarget);
    }

    this.behaviorContext.usableActionsWithPotentialValidTargets[actionNameOption] = targetOptions;

    return BehaviorNodeState.Success;
  }
}
