import { ActionCompletionUpdateCommand, ThreatChanges } from "@speed-dungeon/common";
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

  if (battleOption && command.addDelayToTurnScheduler) {
    const actionUserId = command.addDelayToTurnScheduler.schedulerId;
    const actionUserOption = party.getActionUserById(actionUserId);
    const { threatChanges } = command;
    const deserializedThreatChangesOption = threatChanges
      ? ThreatChanges.fromSerialized(threatChanges)
      : undefined;
    battleOption.handleTurnEnded(
      actionUserOption,
      command.addDelayToTurnScheduler.delay,
      deserializedThreatChangesOption
    );
    // a turn ended, so the tracker list must be rebuilt even when handleTurnEnded could not
    // resolve a scheduler to apply the delta to (e.g. a removed condition, or an effect-less
    // PayActionPoint from a weapon swap that emits no hit/resource updates to re-sort elsewhere)
    battleOption.turnOrderManager.updateTrackers(game, party);
  }

  if (battleOption) {
    const newlyActiveTracker = battleOption.turnOrderManager.getFastestActorTurnOrderTracker();
    combatantFocus.updateFocusedCharacterOnNewTurnOrder(newlyActiveTracker);
  }

  if (update.command.unlockInput) {
    party.inputLock.unlockInput();
  }

  handleThreatChangesUpdate(clientApplication, update.command);
}
