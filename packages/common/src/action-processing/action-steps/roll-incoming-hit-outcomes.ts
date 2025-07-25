import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "./index.js";
import { GameUpdateCommand, GameUpdateCommandType } from "../game-update-commands.js";
import {
  COMBAT_ACTION_NAME_STRINGS,
  CombatActionExecutionIntent,
  calculateActionHitOutcomes,
} from "../../combat/index.js";
import { Combatant } from "../../combatants/index.js";
import { AdventuringParty } from "../../adventuring-party/index.js";
import { HitOutcome } from "../../hit-outcome.js";

const stepType = ActionResolutionStepType.RollIncomingHitOutcomes;
export class RollIncomingHitOutcomesActionResolutionStep extends ActionResolutionStep {
  constructor(context: ActionResolutionStepContext) {
    const hitOutcomesResult = calculateActionHitOutcomes(context);
    if (hitOutcomesResult instanceof Error) {
      console.error(
        "ERROR WITH ACTION",
        COMBAT_ACTION_NAME_STRINGS[context.tracker.actionExecutionIntent.actionName]
      );
      throw hitOutcomesResult;
    }

    const gameUpdateCommand: GameUpdateCommand = {
      type: GameUpdateCommandType.HitOutcomes,
      actionUserName: context.combatantContext.combatant.entityProperties.name,
      step: stepType,
      completionOrderId: null,
      actionName: context.tracker.actionExecutionIntent.actionName,
      actionUserId: context.combatantContext.combatant.entityProperties.id,
      outcomes: hitOutcomesResult,
    };
    super(stepType, context, gameUpdateCommand);

    this.context.tracker.hitOutcomes = hitOutcomesResult;

    const { hitPointChanges, manaChanges } = hitOutcomesResult;

    // apply hit outcomes to the game state so subsequent action.shouldExecute calls can check if
    // their target is dead, user is out of mana etc
    const combatantsKilled = hitPointChanges?.applyToGame(this.context.combatantContext);
    if (combatantsKilled)
      for (const entityId of combatantsKilled)
        gameUpdateCommand.outcomes.insertOutcomeFlag(HitOutcome.Death, entityId);

    manaChanges?.applyToGame(this.context.combatantContext);

    const { game, party } = context.combatantContext;
    const battleOption = AdventuringParty.getBattleOption(party, game);
    battleOption?.turnOrderManager.updateTrackers(game, party);
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
