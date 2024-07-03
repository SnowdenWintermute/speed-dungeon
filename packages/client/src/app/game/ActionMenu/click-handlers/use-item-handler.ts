import { AlertState } from "@/stores/alert-store";
import { GameState } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";
import { UIState } from "@/stores/ui-store";
import { PartyClientSocket } from "@/stores/websocket-store";
import getFocusedCharacter from "@/utils/getFocusedCharacter";
import {
  CombatActionType,
  CombatantProperties,
  ClientToServerEvent,
  ItemPropertiesType,
} from "@speed-dungeon/common";
import selectCombatActionHandler from "./select-combat-action-handler";

export default function useItemHandler(
  gameState: GameState,
  uiState: UIState,
  mutateAlertState: MutateState<AlertState>,
  socket: PartyClientSocket
) {
  const altSlotTargeted = uiState.modKeyHeld;
  const itemOption = gameState.selectedItem;
  if (itemOption) {
    switch (itemOption.itemProperties.type) {
      case ItemPropertiesType.Equipment:
        useEquipmentHandler(gameState, socket, itemOption.entityProperties.id, altSlotTargeted);
      case ItemPropertiesType.Consumable:
        selectCombatActionHandler(gameState, mutateAlertState, socket, {
          type: CombatActionType.ConsumableUsed,
          itemId: itemOption.entityProperties.id,
        });
    }
  }
}

function useEquipmentHandler(
  gameState: GameState,
  socket: PartyClientSocket,
  itemId: string,
  altSlot: boolean
) {
  const focusedCharacterResult = getFocusedCharacter(gameState);
  if (focusedCharacterResult instanceof Error) return focusedCharacterResult;
  const focusedCharacter = focusedCharacterResult;
  const slotEquippedOption = CombatantProperties.getSlotItemIsEquippedTo(
    focusedCharacter.combatantProperties,
    itemId
  );
  if (slotEquippedOption !== null) {
    socket.emit(
      ClientToServerEvent.UnequipSlot,
      focusedCharacter.entityProperties.id,
      slotEquippedOption
    );
  } else {
    socket.emit(ClientToServerEvent.EquipInventoryItem, {
      characterId: focusedCharacter.entityProperties.id,
      itemId,
      equipToAlternateSlot: altSlot,
    });
  }
}
