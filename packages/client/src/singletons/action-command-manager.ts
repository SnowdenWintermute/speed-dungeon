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
  // ON QUEUE EMPTY
  useGameStore.getState().mutateState((state) => {
    const usernameOption = state.username;
    if (!usernameOption) return;
    const partyOption = getCurrentParty(state, usernameOption);
    if (!partyOption) return;
    InputLock.unlockInput(partyOption.inputLock);
  });
});
export const actionCommandWaitingArea: ActionCommand[] = [];

export async function processClientActionCommands(
  entityId: string,
  payloads: ActionCommandPayload[]
) {
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

  /// NEXT THING IS TO MAKE THIS A PROMISE THAT RESOLVES WHEN THE ACTION QUEU IS EMPTY
  // SO THE MODEL MANAGER KNOWS IT CAN DO THE NEXT THINGS
  actionCommandManager.enqueueNewCommands(actionCommands);
}
