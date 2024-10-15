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
    console.log("characters list: ", characters);
    mutateLobbyState((state) => {
      state.savedCharacters = characters;
    });
  });

  socket.on(ServerToClientEvent.SavedCharacterDeleted, (id) => {
    console.log("got deleted character id: ", id);
    mutateLobbyState((state) => {
      for (const [slot, character] of Object.entries(state.savedCharacters)) {
        const slotAsNumber = parseInt(slot);
        if (character?.entityProperties.id === id) {
          state.savedCharacters[slotAsNumber] = null;
          console.log("set ", slotAsNumber, " to null");
          break;
        }
      }
    });
  });

  socket.on(ServerToClientEvent.SavedCharacter, (character, slot) => {
    console.log("setting character ", character, " to slot ", slot);
    mutateLobbyState((state) => {
      state.savedCharacters[slot] = character;
    });
  });
}
