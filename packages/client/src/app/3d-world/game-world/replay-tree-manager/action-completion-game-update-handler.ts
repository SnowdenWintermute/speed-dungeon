import getCurrentParty from "@/utils/getCurrentParty";
import { useGameStore } from "@/stores/game-store";
import { ERROR_MESSAGES, InputLock, InputLockUpdateCommand } from "@speed-dungeon/common";

export async function actionCompletionGameUpdateHandler(update: {
  command: InputLockUpdateCommand;
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
      battleOption.turnOrderManager.updateTrackers(state.game, partyOption);
    });
  }

  if (update.command.unlockInput) {
    useGameStore.getState().mutateState((state) => {
      const partyOption = getCurrentParty(state, state.username || "");
      if (partyOption) InputLock.unlockInput(partyOption.inputLock);
    });
  }

  update.isComplete = true;
}
