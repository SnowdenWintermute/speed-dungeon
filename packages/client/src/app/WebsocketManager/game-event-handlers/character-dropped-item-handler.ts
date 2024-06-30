import { AlertState } from "@/stores/alert-store";
import { GameState } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";
import {
  CharacterAndItem,
  CharacterAssociatedData,
  ClientToServerEvent,
  ClientToServerEventTypes,
  Inventory,
  ServerToClientEventTypes,
} from "@speed-dungeon/common";
import { Socket } from "socket.io-client";
import clientCharacterActionHandler from "../client-character-action-handler";

export default function characterDroppedItemHandler(
  socket: Socket<ServerToClientEventTypes, ClientToServerEventTypes>,
  mutateGameState: MutateState<GameState>,
  mutateAlertState: MutateState<AlertState>,
  characterAndItem: CharacterAndItem
) {
  const { characterId, itemId } = characterAndItem;
  socket.emit(ClientToServerEvent.AcknowledgeReceiptOfItemOnGroundUpdate, itemId);

  clientCharacterActionHandler(
    mutateGameState,
    mutateAlertState,
    characterId,
    ({ party, character }: CharacterAssociatedData) => {
      const itemResult = Inventory.removeItem(character.combatantProperties.inventory, itemId);
      if (itemResult instanceof Error) return itemResult;
      const item = itemResult;
      party.currentRoom.items.push(item);
    }
  );
}
