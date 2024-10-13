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
}
