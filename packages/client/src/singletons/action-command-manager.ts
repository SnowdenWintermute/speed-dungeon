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

  if (actionCommandWaitingArea.length) {
    console.log("sending waiting area to queue");
    actionCommandManager.queue.push(...actionCommandWaitingArea);
    actionCommandWaitingArea.length = 0;
    actionCommandManager.processNextCommand();
  }
});
export const actionCommandWaitingArea: ActionCommand[] = [];

export function enqueueClientActionCommands(entityId: string, payloads: ActionCommandPayload[]) {
  const { gameName } = useGameStore.getState();
  if (gameName === undefined || gameName === null)
    return setAlert(new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME));
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

  if (!useGameStore.getState().combatantModelsAwaitingSpawn)
    actionCommandManager.enqueueNewCommands(actionCommands);
  else actionCommandWaitingArea.push(...actionCommands);
}
