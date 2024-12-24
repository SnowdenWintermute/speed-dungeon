import { ClientActionCommandReceiver } from "@/app/client-action-command-receiver";
import { setAlert } from "@/app/components/alerts";
import { useGameStore } from "@/stores/game-store";
import getCurrentParty from "@/utils/getCurrentParty";
import {
  ActionCommand,
  ActionCommandManager,
  ActionCommandPayload,
  ERROR_MESSAGES,
  EntityId,
  InputLock,
  removeFromArray,
} from "@speed-dungeon/common";

export const actionCommandReceiver: { current: ClientActionCommandReceiver } = {
  current: new ClientActionCommandReceiver(),
};

export class ClientActionCommandManager extends ActionCommandManager {
  entitiesPerformingActions: EntityId[] = [];
  markCommandSequenceAsCompleted: (() => void) | null = null;

  constructor() {
    super();
  }

  registerEntityAsProcessing(entityId: EntityId) {
    this.entitiesPerformingActions.push(entityId);
  }
  unregisterEntityAsProcessing(entityId: EntityId) {
    removeFromArray(this.entitiesPerformingActions, entityId);
  }

  enqueueNewClientCommands(
    associatedEntity: EntityId,
    commands: ActionCommand[],
    markCommandSequenceAsCompleted: () => void
  ): void {
    actionCommandManager.registerEntityAsProcessing(associatedEntity);
    this.markCommandSequenceAsCompleted = markCommandSequenceAsCompleted;
    this.enqueueNewCommands(commands);
  }

  endCurrentActionCommandSequenceIfAllEntitiesAreDoneProcessing(entityDoneWithActions: EntityId) {
    removeFromArray(actionCommandManager.entitiesPerformingActions, entityDoneWithActions);
    if (
      this.markCommandSequenceAsCompleted !== null &&
      this.entitiesPerformingActions.length === 0 &&
      this.queue.length === 0 &&
      this.currentlyProcessing === null
    )
      this.markCommandSequenceAsCompleted();
  }

  onActionsCompleted() {
    useGameStore.getState().mutateState((state) => {
      const usernameOption = state.username;
      if (!usernameOption) return;
      const partyOption = getCurrentParty(state, usernameOption);
      if (!partyOption) return;
      InputLock.unlockInput(partyOption.inputLock);
    });
  }
}

export const actionCommandManager = new ClientActionCommandManager();

export async function processClientActionCommands(
  entityId: string,
  payloads: ActionCommandPayload[]
) {
  const { gameName } = useGameStore.getState();
  if (gameName === undefined || gameName === null)
    return setAlert(new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME));
  const reciever = actionCommandReceiver.current;
  if (!reciever) return console.error("NO RECEIVER");
  const actionCommands = payloads.map(
    (payload) => new ActionCommand(gameName, actionCommandManager, entityId, payload, reciever)
  );

  const waitForCommands = new Promise<void>((resolve, reject) => {
    actionCommandManager.enqueueNewClientCommands(entityId, actionCommands, () => {
      resolve();
    });
  });

  return waitForCommands;
}
