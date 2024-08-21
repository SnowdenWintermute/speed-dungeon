import { ERROR_MESSAGES } from "@speed-dungeon/common";
import { CombatantModelActionProgressTracker, CombatantModelActionType } from "../model-actions";
import { ModularCharacter } from "../modular-character";

export default function performCombatActionModelActionProcessor(
  combatantModel: ModularCharacter,
  modelActionTracker: CombatantModelActionProgressTracker
) {
  if (modelActionTracker.modelAction.type !== CombatantModelActionType.PerformCombatAction)
    return new Error(ERROR_MESSAGES.CHECKED_EXPECTATION_FAILED);

  if (modelActionTracker.animationOption && modelActionTracker.animationEnded)
    combatantModel.removeActiveModelAction(CombatantModelActionType.PerformCombatAction);
}
