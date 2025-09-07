import getCurrentParty from "@/utils/getCurrentParty";
import { useGameStore } from "@/stores/game-store";
import {
  ActionCompletionUpdateCommand,
  CombatantProperties,
  CombatantTurnTracker,
  ERROR_MESSAGES,
  InputLock,
} from "@speed-dungeon/common";
import { characterAutoFocusManager } from "@/singletons/character-autofocus-manager";
import { handleThreatChangesUpdate } from "./handle-threat-changes";

export async function actionCompletionGameUpdateHandler(update: {
  command: ActionCompletionUpdateCommand;
  isComplete: boolean;
}) {
  if (update.command.endActiveCombatantTurn) {
    useGameStore.getState().mutateState((state) => {
      const battleId = state.getCurrentBattleId();
      if (!battleId) return console.error("no battle but tried to end turn");
      const battleOption = state.game?.battles[battleId];
      if (!state.game) throw new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
      if (!battleOption) return console.error("no battle but tried to end turn");
      const partyOption = getCurrentParty(state, state.username || "");
      if (!partyOption) throw new Error(ERROR_MESSAGES.PLAYER.MISSING_PARTY_NAME);

      const actionNameOption = update.command.actionName;

      battleOption.turnOrderManager.updateSchedulerWithExecutedActionDelay(
        partyOption,
        actionNameOption
      );

      // REFILL THE QUICK ACTIONS OF THE CURRENT TURN
      // this way, if we want to remove their quick actions they can be at risk
      // of actions taking them away before they get their turn again
      const fastestTracker = battleOption.turnOrderManager.getFastestActorTurnOrderTracker();
      if (fastestTracker instanceof CombatantTurnTracker) {
        const { combatantProperties } = fastestTracker.getCombatant(partyOption);
        CombatantProperties.refillActionPoints(combatantProperties);
        CombatantProperties.tickCooldowns(combatantProperties);
      }

      battleOption.turnOrderManager.updateTrackers(state.game, partyOption);
      const newlyActiveTracker = battleOption.turnOrderManager.getFastestActorTurnOrderTracker();
      characterAutoFocusManager.updateFocusedCharacterOnNewTurnOrder(state, newlyActiveTracker);
    });
  }

  if (update.command.unlockInput) {
    useGameStore.getState().mutateState((state) => {
      const partyOption = getCurrentParty(state, state.username || "");
      if (partyOption) InputLock.unlockInput(partyOption.inputLock);
    });
  }

  handleThreatChangesUpdate(update.command.threatChanges);

  update.isComplete = true;
}
