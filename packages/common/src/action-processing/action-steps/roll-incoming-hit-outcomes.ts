import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "./index.js";
import { GameUpdateCommand, GameUpdateCommandType } from "../game-update-commands.js";
import { CombatActionExecutionIntent, calculateActionHitOutcomes } from "../../combat/index.js";
import { Combatant, CombatantProperties } from "../../combatants/index.js";
import { AdventuringParty } from "../../adventuring-party/index.js";

const stepType = ActionResolutionStepType.RollIncomingHitOutcomes;
export class RollIncomingHitOutcomesActionResolutionStep extends ActionResolutionStep {
  constructor(context: ActionResolutionStepContext) {
    const hitOutcomesResult = calculateActionHitOutcomes(context);
    if (hitOutcomesResult instanceof Error) throw hitOutcomesResult;

    const gameUpdateCommand: GameUpdateCommand = {
      type: GameUpdateCommandType.HitOutcomes,
      actionUserId: context.combatantContext.combatant.entityProperties.id,
      step: stepType,
      completionOrderId: null,
      actionName: context.tracker.actionExecutionIntent.actionName,
      outcomes: hitOutcomesResult,
    };
    super(stepType, context, gameUpdateCommand);

    this.context.tracker.hitOutcomes = hitOutcomesResult;

    const { party } = this.context.combatantContext;

    const { hitPointChanges, manaChanges } = hitOutcomesResult;

    if (manaChanges)
      for (const [targetId, mpChange] of Object.entries(manaChanges)) {
        const targetResult = AdventuringParty.getCombatant(party, targetId);
        if (targetResult instanceof Error) throw targetResult;
        CombatantProperties.changeMana(targetResult.combatantProperties, mpChange);
      }

    // apply hit outcomes to the game state so subsequent action.shouldExecute calls can check if
    // their target is dead, user is out of mana etc
    hitPointChanges?.applyToGame(this.context.combatantContext);
  }

  protected onTick = () => {};
  getTimeToCompletion = () => 0;
  isComplete = () => true;

  protected getBranchingActions():
    | Error
    | { user: Combatant; actionExecutionIntent: CombatActionExecutionIntent }[] {
    return [];
  }
}
