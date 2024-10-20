import {
  ClientToServerEventTypes,
  ServerToClientEventTypes,
  ClientToServerEvent,
  CharacterAssociatedData,
  EquipmentSlot,
  CombatAction,
  NextOrPrevious,
  CombatAttribute,
  getPartyChannelName,
  ServerToClientEvent,
} from "@speed-dungeon/common";
import SocketIO from "socket.io";
import { GameServer } from "../index.js";
import { BrowserTabSession } from "../socket-connection-metadata.js";
import { applyMiddlewares } from "../event-middleware/index.js";
import toggleReadyToExploreHandler from "./toggle-ready-to-explore-handler.js";
import { getPlayerAssociatedData } from "../event-middleware/get-player-associated-data.js";
import toggleReadyToDescendHandler from "./toggle-ready-to-descend-handler.js";
import { getCharacterAssociatedData } from "../event-middleware/get-character-associated-data.js";
import { prohibitIfDead } from "../event-middleware/prohibit-if-dead.js";
import dropItemHandler from "./drop-item-handler.js";
import dropEquippedItemHandler from "./drop-equipped-item-handler.js";
import unequipSlotHandler from "./unequip-slot-handler.js";

export default function initiateGameEventListeners(
  this: GameServer,
  socket: SocketIO.Socket<ClientToServerEventTypes, ServerToClientEventTypes>
) {
  socket.on(
    ClientToServerEvent.ToggleReadyToExplore,
    applyMiddlewares(getPlayerAssociatedData)(socket, toggleReadyToExploreHandler)
  );
  socket.on(
    ClientToServerEvent.ToggleReadyToDescend,
    applyMiddlewares(getPlayerAssociatedData)(socket, toggleReadyToDescendHandler)
  );
  socket.on(
    ClientToServerEvent.DropItem,
    applyMiddlewares(getCharacterAssociatedData, prohibitIfDead)(socket, dropItemHandler)
  );
  socket.on(
    ClientToServerEvent.DropEquippedItem,
    applyMiddlewares(getCharacterAssociatedData, prohibitIfDead)(socket, dropEquippedItemHandler)
  );
  socket.on(
    ClientToServerEvent.UnequipSlot,
    applyMiddlewares(getCharacterAssociatedData, prohibitIfDead)(socket, unequipSlotHandler)
  );

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
      return this.characterActionHandler(
        socket.id,
        characterId,
        (_socketMeta: BrowserTabSession, characterAssociatedData: CharacterAssociatedData) => {
          const result = this.useSelectedCombatActionHandler(characterAssociatedData);
          if (result instanceof Error) {
            console.error(result);
            const { game, party } = characterAssociatedData;
            this.io
              .in(getPartyChannelName(game.name, party.name))
              .emit(ServerToClientEvent.CharacterSelectedCombatAction, characterId, null);
          }
          return result;
        }
      );
    });
  });
  socket.on(
    ClientToServerEvent.IncrementAttribute,
    (characterId: string, attribute: CombatAttribute) => {
      this.emitErrorEventIfError(socket, () => {
        return this.characterActionHandler(
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

function registerGameEvent(
  this: GameServer,
  socket: SocketIO.Socket<ClientToServerEventTypes, ServerToClientEventTypes>,
  event: ClientToServerEvent,
  handler: (data: any) => void
) {
  socket.on(event, (data: any) => {
    this.useSelectedCombatActionHandler(data);
  });
}
