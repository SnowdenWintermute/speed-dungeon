"use client";
import { setAlert } from "@/app/components/alerts";
import { useGameStore } from "@/stores/game-store";
import { useLobbyStore } from "@/stores/lobby-store";
import {
  AdventuringParty,
  ClientToServerEvent,
  ClientToServerEventTypes,
  InputLock,
  ServerToClientEvent,
  ServerToClientEventTypes,
} from "@speed-dungeon/common";
import { Socket, io } from "socket.io-client";
import setUpBasicLobbyEventHandlers from "@/app/websocket-manager/basic-lobby-event-handlers";
import { setUpGameLobbyEventHandlers } from "@/app/websocket-manager/lobby-event-handlers";
import setUpGameEventHandlers from "@/app/websocket-manager/game-event-handlers";
import setUpSavedCharacterEventListeners from "@/app/websocket-manager/saved-character-event-handlers";
import getCurrentParty from "@/utils/getCurrentParty";
import { getGameWorld } from "@/app/3d-world/SceneManager";
import { ModelActionType } from "@/app/3d-world/game-world/model-manager/model-actions";
import getFocusedCharacter from "@/utils/getFocusedCharacter";
import { synchronizeTargetingIndicators } from "@/app/websocket-manager/game-event-handlers/synchronize-targeting-indicators";

const socketAddress = process.env.NEXT_PUBLIC_WS_SERVER_URL;

export const websocketConnection: Socket<ServerToClientEventTypes, ClientToServerEventTypes> = io(
  socketAddress || "",
  {
    transports: ["websocket"],
    withCredentials: true,
    autoConnect: false,
  }
);

export function resetWebsocketConnection() {
  websocketConnection.disconnect();
  websocketConnection.connect();
  console.info("reconnecting");
}

websocketConnection.on("connect", () => {
  console.info("connected");
  useGameStore.getState().mutateState((state) => {
    state.game = null;
  });
  useLobbyStore.getState().mutateState((state) => {
    state.websocketConnected = true;
  });
  websocketConnection.emit(ClientToServerEvent.RequestsGameList);
  websocketConnection.emit(ClientToServerEvent.GetSavedCharactersList);

  getGameWorld().modelManager.modelActionQueue.enqueueMessage({
    type: ModelActionType.SynchronizeCombatantModels,
  });
});

websocketConnection.on("disconnect", () => {
  console.info("disconnected");
  useLobbyStore.getState().mutateState((state) => {
    state.websocketConnected = false;
  });
});
websocketConnection.on(ServerToClientEvent.ErrorMessage, (message) => {
  setAlert(new Error(message));

  // this is a quick and dirty fix until we have a way to associate errors
  // with certain actions, which would also be good to associate responses with
  // certain actions so we can show the buttons in a loading state
  useGameStore.getState().mutateState((state) => {
    const partyOption = getCurrentParty(state, state.username || "");
    if (partyOption) {
      InputLock.unlockInput(partyOption.inputLock);
      const focusedCharacter = AdventuringParty.getCombatant(partyOption, state.focusedCharacterId);
      if (!(focusedCharacter instanceof Error)) {
        focusedCharacter.combatantProperties.selectedItemId = null;
        focusedCharacter.combatantProperties.selectedTargetingScheme = null;
        focusedCharacter.combatantProperties.selectedCombatAction = null;
        focusedCharacter.combatantProperties.selectedCombatAction = null;
        focusedCharacter.combatantProperties.combatActionTarget = null;
        synchronizeTargetingIndicators(state, null, state.focusedCharacterId, []);
      }
    }
  });
});

setUpBasicLobbyEventHandlers(websocketConnection);
setUpGameLobbyEventHandlers(websocketConnection);
setUpGameEventHandlers(websocketConnection);
setUpSavedCharacterEventListeners(websocketConnection);
