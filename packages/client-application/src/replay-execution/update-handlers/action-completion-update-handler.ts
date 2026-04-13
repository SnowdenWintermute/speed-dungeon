import {
  ActionCompletionUpdateCommand,
  CombatantTurnScheduler,
  ThreatChanges,
} from "@speed-dungeon/common";
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
  }

  if (battleOption) {
    // battleOption.turnOrderManager.updateTrackers(game, party);
    const newlyActiveTracker = battleOption.turnOrderManager.getFastestActorTurnOrderTracker();
    combatantFocus.updateFocusedCharacterOnNewTurnOrder(newlyActiveTracker);
  }

  if (update.command.unlockInput) {
    party.inputLock.unlockInput();
  }

  handleThreatChangesUpdate(clientApplication, update.command);
}
