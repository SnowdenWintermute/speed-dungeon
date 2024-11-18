import { gameWorld } from "@/app/3d-world/SceneManager";
import { useLobbyStore } from "@/stores/lobby-store";
import {
  ClientToServerEventTypes,
  ServerToClientEvent,
  ServerToClientEventTypes,
} from "@speed-dungeon/common";
import { Socket } from "socket.io-client";

export default function setUpSavedCharacterEventListeners(
  socket: Socket<ServerToClientEventTypes, ClientToServerEventTypes>
) {
  const mutateLobbyState = useLobbyStore.getState().mutateState;
  socket.on(ServerToClientEvent.SavedCharacterList, (characters) => {
    gameWorld.current?.drawCharacterSlots();
    mutateLobbyState((state) => {
      state.savedCharacters = characters;
    });
  });

  socket.on(ServerToClientEvent.SavedCharacterDeleted, (id) => {
    mutateLobbyState((state) => {
      for (const [slot, character] of Object.entries(state.savedCharacters)) {
        const slotAsNumber = parseInt(slot);
        if (character?.combatant.entityProperties.id === id) {
          state.savedCharacters[slotAsNumber] = null;
          break;
        }
      }
    });
  });

  socket.on(ServerToClientEvent.SavedCharacter, (character, slot) => {
    mutateLobbyState((state) => {
      state.savedCharacters[slot] = character;
    });
  });
}
