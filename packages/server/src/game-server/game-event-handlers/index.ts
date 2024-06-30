import {
  ClientToServerEventTypes,
  ServerToClientEventTypes,
  ClientToServerEvent,
  CharacterAssociatedData,
} from "@speed-dungeon/common";
import SocketIO from "socket.io";
import { GameServer } from "..";

export default function initiateGameEventListeners(
  this: GameServer,
  socket: SocketIO.Socket<ClientToServerEventTypes, ServerToClientEventTypes>
) {
  socket.on(ClientToServerEvent.ToggleReadyToExplore, () => {
    this.emitErrorEventIfError(socket, () => this.toggleReadyToExploreHandler(socket.id));
  });

  socket.on(ClientToServerEvent.DropItem, (characterId: string, itemId: string) => {
    this.emitErrorEventIfError(socket, () =>
      this.characterActionHandler(
        socket.id,
        characterId,
        (characterAssociatedData: CharacterAssociatedData) =>
          this.dropItemHandler(characterAssociatedData, itemId)
      )
    );
  });
}
