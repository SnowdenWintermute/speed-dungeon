import {
  ActionIntentAndUser,
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "./index.js";
import { GameUpdateCommand, GameUpdateCommandType } from "../game-update-commands.js";
import {
  COMBAT_ACTIONS,
  COMBAT_ACTION_NAME_STRINGS,
  HitOutcomeCalculator,
  HitPointChanges,
} from "../../combat/index.js";
import { HitOutcome } from "../../hit-outcome.js";
import { BasicRandomNumberGenerator } from "../../utility-classes/randomizers.js";
import { CombatActionResource } from "../../combat/combat-actions/combat-action-hit-outcome-properties.js";

const stepType = ActionResolutionStepType.RollIncomingHitOutcomes;
export class RollIncomingHitOutcomesActionResolutionStep extends ActionResolutionStep {
  constructor(context: ActionResolutionStepContext) {
    const { actionName } = context.tracker.actionExecutionIntent;
    const action = COMBAT_ACTIONS[actionName];

    // @PERF - make this a singleton and move these steps to the server
    const rng = new BasicRandomNumberGenerator();

    const { actionUserContext, tracker } = context;

    const hitOutcomeCalculator = new HitOutcomeCalculator(
      actionUserContext,
      tracker.actionExecutionIntent,
      rng
    );
    const hitOutcomesResult = hitOutcomeCalculator.calculateHitOutcomes();

    if (hitOutcomesResult instanceof Error) {
      console.error(
        "ERROR WITH ACTION",
        COMBAT_ACTION_NAME_STRINGS[context.tracker.actionExecutionIntent.actionName]
      );
      throw hitOutcomesResult;
    }

    const { actionUser } = actionUserContext;

    const gameUpdateCommand: GameUpdateCommand = {
      type: GameUpdateCommandType.HitOutcomes,
      actionUserName: actionUser.getName(),
      step: stepType,
      completionOrderId: null,
      actionName: context.tracker.actionExecutionIntent.actionName,
      actionUserId: actionUser.getEntityId(),
      outcomes: hitOutcomesResult,
    };
    super(stepType, context, gameUpdateCommand);

    this.context.tracker.hitOutcomes = hitOutcomesResult;

    const { game, party } = actionUserContext;

    // apply hit outcomes to the game state so subsequent action.shouldExecute calls can check if
    // their target is dead, user is out of mana etc
    if (hitOutcomesResult.resourceChanges) {
      const hitPointChangesOption =
        hitOutcomesResult.resourceChanges[CombatActionResource.HitPoints];
      if (hitPointChangesOption instanceof HitPointChanges) {
        const combatantsKilled = hitPointChangesOption?.applyToGame(party);
        if (combatantsKilled)
          for (const entityId of combatantsKilled) {
            gameUpdateCommand.outcomes.insertOutcomeFlag(HitOutcome.Death, entityId);
          }
      }

      const manaChangesOption = hitOutcomesResult.resourceChanges[CombatActionResource.Mana];
      manaChangesOption?.applyToGame(party);
    }

    const threatChangesOption = action.hitOutcomeProperties.getThreatChangesOnHitOutcomes(
      context,
      hitOutcomesResult
    );

    if (threatChangesOption) {
      threatChangesOption.applyToGame(party);
      gameUpdateCommand.threatChanges = threatChangesOption;
    }

    console.log("threat changes in RollIncomingHitOutcomes:", gameUpdateCommand.threatChanges);

    const battleOption = party.getBattleOption(game);
    battleOption?.turnOrderManager.updateTrackers(game, party);
  }

  protected onTick = () => {};
  getTimeToCompletion = () => 0;
  isComplete = () => true;

  protected getBranchingActions(): Error | ActionIntentAndUser[] {
    return [];
  }
}
