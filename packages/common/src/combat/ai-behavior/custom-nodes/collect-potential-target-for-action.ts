import { Combatant } from "../../../combatants/index.js";
import { NextOrPrevious } from "../../../primatives/index.js";
import { throwIfError } from "../../../utils/index.js";
import { COMBAT_ACTIONS } from "../../combat-actions/action-implementations/index.js";
import { CombatActionName } from "../../combat-actions/combat-action-names.js";
import { CombatActionTarget } from "../../targeting/combat-action-targets.js";
import { TargetingCalculator } from "../../targeting/targeting-calculator.js";
import { AIBehaviorContext } from "../ai-context.js";
import { BehaviorNode, BehaviorNodeState } from "../behavior-tree.js";

export class CollectPotentialTargetsForAction implements BehaviorNode {
  constructor(
    private behaviorContext: AIBehaviorContext,
    private combatant: Combatant,
    private actionNameOption: null | CombatActionName
  ) {}
  execute(): BehaviorNodeState {
    if (this.actionNameOption === null) return BehaviorNodeState.Failure;

    const { entityProperties, combatantProperties } = this.combatant;
    const action = COMBAT_ACTIONS[this.actionNameOption];

    const targetingCalculator = new TargetingCalculator(
      this.behaviorContext.combatantContext,
      null
    );

    // must set it as selected since targetingCalculator will look for it
    combatantProperties.selectedCombatAction = this.actionNameOption;

    const defaultTargetsResult: Error | CombatActionTarget =
      targetingCalculator.getPreferredOrDefaultActionTargets(action);
    if (defaultTargetsResult instanceof Error) return BehaviorNodeState.Failure;

    const targetOptions: CombatActionTarget[] = [defaultTargetsResult];
    const targetingSchemeOptions = [
      ...action.targetingProperties.getTargetingSchemes(this.combatant),
    ];

    while (targetingSchemeOptions.length) {
      let currentOption = throwIfError(
        targetingCalculator.cycleCharacterTargets(entityProperties.id, NextOrPrevious.Next)
      );
      while (!targetOptions.includes(currentOption)) {
        targetOptions.push(currentOption);

        currentOption = throwIfError(
          targetingCalculator.cycleCharacterTargets(entityProperties.id, NextOrPrevious.Next)
        );
      }

      targetingSchemeOptions.pop();
      targetingCalculator.cycleCharacterTargetingSchemes(entityProperties.id);
    }

    this.behaviorContext.usableActionsWithPotentialValidTargets[this.actionNameOption] =
      targetOptions;

    return BehaviorNodeState.Success;
  }
}
