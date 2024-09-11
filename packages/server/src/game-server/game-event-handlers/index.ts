import {
  ClientToServerEventTypes,
  ServerToClientEventTypes,
  ClientToServerEvent,
  CharacterAssociatedData,
  EquipmentSlot,
  CombatAction,
  NextOrPrevious,
  PlayerAssociatedData,
  CombatAttribute,
} from "@speed-dungeon/common";
import SocketIO from "socket.io";
import { GameServer } from "..";
import { BrowserTabSession } from "../socket-connection-metadata";

export default function initiateGameEventListeners(
  this: GameServer,
  socket: SocketIO.Socket<ClientToServerEventTypes, ServerToClientEventTypes>
) {
  socket.on(ClientToServerEvent.ToggleReadyToExplore, () => {
    this.emitErrorEventIfError(socket, () =>
      this.playerAssociatedDataProvider(socket.id, (playerAssociatedData: PlayerAssociatedData) =>
        this.toggleReadyToExploreHandler(playerAssociatedData)
      )
    );
  });
  socket.on(ClientToServerEvent.ToggleReadyToDescend, () => {
    this.emitErrorEventIfError(socket, () =>
      this.playerAssociatedDataProvider(socket.id, (playerAssociatedData: PlayerAssociatedData) =>
        this.toggleReadyToDescendHandler(playerAssociatedData)
      )
    );
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
  socket.on(
    ClientToServerEvent.SelectCombatAction,
    (characterId: string, combatAction: null | CombatAction) => {
      this.emitErrorEventIfError(socket, () =>
        this.characterActionHandler(
          socket.id,
          characterId,
          (socketMeta: BrowserTabSession, characterAssociatedData: CharacterAssociatedData) =>
            this.selectCombatActionHandler(socketMeta, characterAssociatedData, combatAction)
        )
      );
    }
  );
  socket.on(
    ClientToServerEvent.CycleCombatActionTargets,
    (characterId: string, direction: NextOrPrevious) => {
      this.emitErrorEventIfError(socket, () =>
        this.characterActionHandler(
          socket.id,
          characterId,
          (socketMeta: BrowserTabSession, characterAssociatedData: CharacterAssociatedData) =>
            this.cycleTargetsHandler(socket, socketMeta, characterAssociatedData, direction)
        )
      );
    }
  );
  socket.on(ClientToServerEvent.CycleTargetingSchemes, (characterId: string) => {
    this.emitErrorEventIfError(socket, () =>
      this.characterActionHandler(
        socket.id,
        characterId,
        (socketMeta: BrowserTabSession, characterAssociatedData: CharacterAssociatedData) =>
          this.cycleTargetingSchemesHandler(socket, socketMeta, characterAssociatedData)
      )
    );
  });
  socket.on(ClientToServerEvent.UseSelectedCombatAction, (characterId: string) => {
    this.emitErrorEventIfError(socket, () => {
      this.characterActionHandler(
        socket.id,
        characterId,
        (_socketMeta: BrowserTabSession, characterAssociatedData: CharacterAssociatedData) => {
          const result = this.useSelectedCombatActionHandler(characterAssociatedData);
          if (result instanceof Error) console.error(result);
          return result
        }
      );
    });
  });
  socket.on(
    ClientToServerEvent.IncrementAttribute,
    (characterId: string, attribute: CombatAttribute) => {
      this.emitErrorEventIfError(socket, () => {
        this.characterActionHandler(
          socket.id,
          characterId,
          (_socketMeta: BrowserTabSession, characterAssociatedData: CharacterAssociatedData) => {
            const result = this.characterSpentAttributePointHandler(
              characterAssociatedData,
              attribute
            );
            if (result instanceof Error) console.error(result);
          }
        );
      });
    }
  );
}
