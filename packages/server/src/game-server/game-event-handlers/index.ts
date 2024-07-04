import {
  ClientToServerEventTypes,
  ServerToClientEventTypes,
  ClientToServerEvent,
  CharacterAssociatedData,
  EquipmentSlot,
} from "@speed-dungeon/common";
import SocketIO from "socket.io";
import { GameServer } from "..";
import { BrowserTabSession } from "../socket-connection-metadata";

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
        (_socketMeta: BrowserTabSession, characterAssociatedData: CharacterAssociatedData) =>
          this.dropItemHandler(characterAssociatedData, itemId)
      )
    );
  });
  socket.on(ClientToServerEvent.DropEquippedItem, (characterId: string, slot: EquipmentSlot) => {
    this.emitErrorEventIfError(socket, () =>
      this.characterActionHandler(
        socket.id,
        characterId,
        (_socketMeta: BrowserTabSession, characterAssociatedData: CharacterAssociatedData) =>
          this.dropEquippedItemHandler(characterAssociatedData, slot)
      )
    );
  });
  socket.on(ClientToServerEvent.UnequipSlot, (characterId: string, slot: EquipmentSlot) => {
    this.emitErrorEventIfError(socket, () =>
      this.characterActionHandler(
        socket.id,
        characterId,
        (_socketMeta: BrowserTabSession, characterAssociatedData: CharacterAssociatedData) =>
          this.unequipSlotHandler(characterAssociatedData, slot)
      )
    );
  });
  socket.on(
    ClientToServerEvent.EquipInventoryItem,
    ({ characterId, itemId, equipToAlternateSlot }) => {
      this.emitErrorEventIfError(socket, () =>
        this.characterActionHandler(
          socket.id,
          characterId,
          (_socketMeta: BrowserTabSession, characterAssociatedData: CharacterAssociatedData) =>
            this.equipItemHandler(characterAssociatedData, itemId, equipToAlternateSlot)
        )
      );
    }
  );
  socket.on(ClientToServerEvent.PickUpItem, ({ characterId, itemId }) => {
    this.emitErrorEventIfError(socket, () =>
      this.characterActionHandler(
        socket.id,
        characterId,
        (_socketMeta: BrowserTabSession, characterAssociatedData: CharacterAssociatedData) =>
          this.pickUpItemHandler(characterAssociatedData, itemId)
      )
    );
  });
  socket.on(ClientToServerEvent.AcknowledgeReceiptOfItemOnGroundUpdate, (itemId: string) => {
    this.emitErrorEventIfError(socket, () =>
      this.acknowledgeReceiptOfItemOnGroundHandler(socket.id, itemId)
    );
  });
}
