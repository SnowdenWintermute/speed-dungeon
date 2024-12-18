import { ClientActionCommandReceiver } from "@/app/client-action-command-receiver";
import { setAlert } from "@/app/components/alerts";
import { useGameStore } from "@/stores/game-store";
import {
  ActionCommand,
  ActionCommandManager,
  ActionCommandPayload,
  ERROR_MESSAGES,
} from "@speed-dungeon/common";

export const actionCommandReceiver: { current: null | ClientActionCommandReceiver } = {
  current: null,
};
export const actionCommandManager = new ActionCommandManager();
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
