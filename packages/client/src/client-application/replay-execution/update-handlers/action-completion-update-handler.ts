import { ActionCompletionUpdateCommand, CombatantTurnTracker } from "@speed-dungeon/common";
import { ClientApplication } from "@/client-application";
import { ReplayGameUpdateTracker } from "../replay-game-update-completion-tracker";
import { handleThreatChangesUpdate } from "./activated-triggers-update-handler/threat-changes";

export async function actionCompletionGameUpdateHandler(
  clientApplication: ClientApplication,
  update: ReplayGameUpdateTracker<ActionCompletionUpdateCommand>
) {
  const { combatantFocus } = clientApplication;
  const { game, party } = combatantFocus.requireFocusedCharacterContext();

  if (update.command.endActiveCombatantTurn) {
    const battleOption = party.getBattleOption(game);
    if (!battleOption) {
      return console.error("no battle but tried to end turn");
    }

    const actionNameOption = update.command.actionName;

    battleOption.turnOrderManager.updateFastestSchedulerWithExecutedActionDelay(
      party,
      actionNameOption
    );

    // REFILL THE QUICK ACTIONS OF THE CURRENT TURN
    // this way, if we want to remove their quick actions they can be at risk
    // of actions taking them away before they get their turn again
    const fastestTracker = battleOption.turnOrderManager.getFastestActorTurnOrderTracker();
    if (fastestTracker instanceof CombatantTurnTracker) {
      const { combatantProperties } = party.combatantManager.getExpectedCombatant(
        fastestTracker.getTaggedIdOfTrackedEntity().combatantId
      );
      combatantProperties.resources.refillActionPoints();
      combatantProperties.abilityProperties.tickCooldowns();
    }

    battleOption.turnOrderManager.updateTrackers(game, party);
    const newlyActiveTracker = battleOption.turnOrderManager.getFastestActorTurnOrderTracker();
    combatantFocus.updateFocusedCharacterOnNewTurnOrder(newlyActiveTracker);
  }

  if (update.command.unlockInput) {
    if (party) party.inputLock.unlockInput();
  }

  handleThreatChangesUpdate(clientApplication, update.command);

  update.setAsQueuedToComplete();
}
