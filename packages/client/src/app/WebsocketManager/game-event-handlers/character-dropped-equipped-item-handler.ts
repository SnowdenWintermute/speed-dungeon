import {
  CharacterAndSlot,
  CharacterAssociatedData,
  ClientToServerEvent,
  ClientToServerEventTypes,
  CombatantProperties,
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
      const itemDroppedIdResult = CombatantProperties.dropEquippedItem(
        party,
        character.combatantProperties,
        slot
      );
      if (itemDroppedIdResult instanceof Error) return itemDroppedIdResult;

      socket.emit(ClientToServerEvent.AcknowledgeReceiptOfItemOnGroundUpdate, itemDroppedIdResult);
    }
  );
}
