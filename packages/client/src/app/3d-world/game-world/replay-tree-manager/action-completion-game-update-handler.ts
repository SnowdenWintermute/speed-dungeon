import {
  ActionCompletionUpdateCommand,
  AdventuringParty,
  CombatantTurnTracker,
  InputLock,
} from "@speed-dungeon/common";
import { characterAutoFocusManager } from "@/singletons/character-autofocus-manager";
import { handleThreatChangesUpdate } from "./handle-threat-changes";
import { GameUpdateTracker } from "./game-update-tracker";
import { AppStore } from "@/mobx-stores/app-store";

export async function actionCompletionGameUpdateHandler(
  update: GameUpdateTracker<ActionCompletionUpdateCommand>
) {
  const { game, party } = AppStore.get().gameStore.getFocusedCharacterContext();

  if (update.command.endActiveCombatantTurn) {
    const battleOption = AdventuringParty.getBattleOption(party, game);
    if (!battleOption) return console.error("no battle but tried to end turn");

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
    characterAutoFocusManager.updateFocusedCharacterOnNewTurnOrder(newlyActiveTracker);
  }

  if (update.command.unlockInput) {
    if (party) InputLock.unlockInput(party.inputLock);
  }

  handleThreatChangesUpdate(update.command);

  update.setAsQueuedToComplete();
}
