import { ActionCompletionUpdateCommand, CombatantTurnScheduler } from "@speed-dungeon/common";
import { ClientApplication } from "@/client-application";
import { ReplayStepExecution } from "../replay-step-execution";
import { handleThreatChangesUpdate } from "./activated-triggers-update-handler/threat-changes";

export async function actionCompletionGameUpdateHandler(
  clientApplication: ClientApplication,
  update: ReplayStepExecution<ActionCompletionUpdateCommand>
) {
  const { combatantFocus } = clientApplication;
  const { game, party } = combatantFocus.requireFocusedCharacterContext();
  const battleOption = party.getBattleOption(game);
  const { command } = update;

  if (command.addDelayToTurnScheduler) {
    const battleOption = party.getBattleOption(game);
    if (!battleOption) {
      return console.error("no battle but tried to end turn");
    }
    // refill action points on turn end
    // this way, if we want to remove their action points they can be at risk
    // of actions taking them away before they get their turn again
    const { schedulerId, delay } = command.addDelayToTurnScheduler;
    const scheduler =
      battleOption.turnOrderManager.turnSchedulerManager.requireSchedulerByEntityId(schedulerId);
    if (scheduler instanceof CombatantTurnScheduler) {
      const combatantEndingTurn = party.combatantManager.getExpectedCombatant(schedulerId);
      combatantEndingTurn.handleTurnEnded();
    }

    console.log("actionCompletionGameUpdateHandler add delay");
    scheduler.addDelay(delay);
  }

  if (battleOption) {
    battleOption.turnOrderManager.updateTrackers(game, party);
    const newlyActiveTracker = battleOption.turnOrderManager.getFastestActorTurnOrderTracker();
    combatantFocus.updateFocusedCharacterOnNewTurnOrder(newlyActiveTracker);
  }

  if (update.command.unlockInput) {
    party.inputLock.unlockInput();
  }

  handleThreatChangesUpdate(clientApplication, update.command);
}
