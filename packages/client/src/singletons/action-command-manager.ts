import { ClientActionCommandReceiver } from "@/app/client-action-command-receiver";
import { setAlert } from "@/app/components/alerts";
import { useGameStore } from "@/stores/game-store";
import getCurrentParty from "@/utils/getCurrentParty";
import {
  ActionCommand,
  ActionCommandManager,
  ActionCommandPayload,
  ERROR_MESSAGES,
  InputLock,
} from "@speed-dungeon/common";

export const actionCommandReceiver: { current: null | ClientActionCommandReceiver } = {
  current: null,
};
export const actionCommandManager = new ActionCommandManager(() => {
  useGameStore.getState().mutateState((state) => {
    const usernameOption = state.username;
    if (!usernameOption) return;
    const partyOption = getCurrentParty(state, usernameOption);
    if (!partyOption) return;
    InputLock.unlockInput(partyOption.inputLock);
  });
});
export const actionCommandWaitingArea: ActionCommand[] = [];

export function enqueueClientActionCommands(entityId: string, payloads: ActionCommandPayload[]) {
  useGameStore.getState().mutateState((gameState) => {
    const { gameName } = gameState;
    if (gameName === undefined || gameName === null)
      return setAlert(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
    if (!actionCommandReceiver.current) return console.error("NO RECEIVER");

    const actionCommands = payloads.map(
      (payload) =>
        new ActionCommand(
          gameName,
          actionCommandManager,
          entityId,
          payload,
          actionCommandReceiver.current!
        )
    );

    if (gameState.combatantModelsAwaitingSpawn.length === 0)
      actionCommandManager.enqueueNewCommands(actionCommands);
    else actionCommandWaitingArea.push(...actionCommands);
  });
}
