import { GameState } from "@/stores/game-store";
import { LobbyState } from "@/stores/lobby-store";
import { MutateState } from "@/stores/mutate-state";
import {
  ClientToServerEventTypes,
  ServerToClientEvent,
  ServerToClientEventTypes,
} from "@speed-dungeon/common";
import { Socket } from "socket.io-client";

export default function setUpSavedCharacterEventListeners(
  socket: Socket<ServerToClientEventTypes, ClientToServerEventTypes>,
  mutateLobbyState: MutateState<LobbyState>
) {
  socket.on(ServerToClientEvent.SavedCharacterList, (characters) => {
    mutateLobbyState((state) => {
      state.savedCharacters = characters;
    });
  });

  socket.on(ServerToClientEvent.SavedCharacterDeleted, (id) => {
    mutateLobbyState((state) => {
      for (const [slot, character] of Object.entries(state.savedCharacters)) {
        const slotAsNumber = parseInt(slot);
        if (character?.entityProperties.id === id) {
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
