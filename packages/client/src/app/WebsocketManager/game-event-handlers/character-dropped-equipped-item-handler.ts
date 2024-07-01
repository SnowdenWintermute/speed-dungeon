import {
  CharacterAndSlot,
  CharacterAssociatedData,
  ClientToServerEvent,
  ClientToServerEventTypes,
  ERROR_MESSAGES,
  ServerToClientEventTypes,
} from "@speed-dungeon/common";
import { Socket } from "socket.io-client";
import clientCharacterActionHandler from "../client-character-action-handler";
import { MutateState } from "@/stores/mutate-state";
import { GameState } from "@/stores/game-store";
import { AlertState } from "@/stores/alert-store";

export default function characterDroppedEquippedItemHandler(
  socket: Socket<ServerToClientEventTypes, ClientToServerEventTypes>,
  mutateGameState: MutateState<GameState>,
  mutateAlertState: MutateState<AlertState>,
  characterAndSlot: CharacterAndSlot
) {
  const { characterId, slot } = characterAndSlot;

  clientCharacterActionHandler(
    mutateGameState,
    mutateAlertState,
    characterId,
    ({ party, character }: CharacterAssociatedData) => {
      const itemOption = character.combatantProperties.equipment[slot];
      if (itemOption === undefined) return new Error(ERROR_MESSAGES.EQUIPMENT.NO_ITEM_EQUIPPED);
      delete character.combatantProperties.equipment[slot];
      const item = itemOption;
      socket.emit(
        ClientToServerEvent.AcknowledgeReceiptOfItemOnGroundUpdate,
        item.entityProperties.id
      );

      party.currentRoom.items.push(item);
    }
  );
}
