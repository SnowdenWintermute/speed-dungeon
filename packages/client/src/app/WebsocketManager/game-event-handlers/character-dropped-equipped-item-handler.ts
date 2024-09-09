import {
  CharacterAndSlot,
  CharacterAssociatedData,
  ClientToServerEvent,
  ClientToServerEventTypes,
  CombatantProperties,
  ServerToClientEventTypes,
} from "@speed-dungeon/common";
import { Socket } from "socket.io-client";
import { MutateState } from "@/stores/mutate-state";
import { GameState } from "@/stores/game-store";
import { AlertState } from "@/stores/alert-store";
import { characterAssociatedDataProvider } from "../combatant-associated-details-providers";

export default function characterDroppedEquippedItemHandler(
  socket: Socket<ServerToClientEventTypes, ClientToServerEventTypes>,
  mutateGameState: MutateState<GameState>,
  mutateAlertState: MutateState<AlertState>,
  characterAndSlot: CharacterAndSlot
) {
  const { characterId, slot } = characterAndSlot;

  characterAssociatedDataProvider(
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
