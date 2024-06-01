import { AlertState } from "@/stores/alert-store";
import { GameState } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";
import { UIState } from "@/stores/ui-store";
import { PartyClientSocket } from "@/stores/websocket-store";
import getFocusedCharacter from "@/utils/getFocusedCharacter";
import {
  CombatActionType,
  CombatantProperties,
  InPartyClientToServerEvent,
  ItemPropertiesType,
} from "@speed-dungeon/common";
import selectCombatActionHandler from "./select-combat-action-handler";

export default function useItemHandler(
  gameState: GameState,
  uiState: UIState,
  mutateAlertState: MutateState<AlertState>,
  partySocket: PartyClientSocket
) {
  const altSlotTargeted = uiState.modKeyHeld;
  const itemOption = gameState.selectedItem;
  if (itemOption) {
    switch (itemOption.itemProperties.type) {
      case ItemPropertiesType.Equipment:
        useEquipmentHandler(
          gameState,
          partySocket,
          itemOption.entityProperties.id,
          altSlotTargeted
        );
      case ItemPropertiesType.Consumable:
        selectCombatActionHandler(gameState, mutateAlertState, partySocket, {
          type: CombatActionType.ConsumableUsed,
          itemId: itemOption.entityProperties.id,
        });
    }
  }
}

function useEquipmentHandler(
  gameState: GameState,
  partySocket: PartyClientSocket,
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
    partySocket.emit(
      InPartyClientToServerEvent.UnequipSlot,
      focusedCharacter.entityProperties.id,
      slotEquippedOption
    );
  } else {
    partySocket.emit(
      InPartyClientToServerEvent.EquipInventoryItem,
      focusedCharacter.entityProperties.id,
      itemId,
      altSlot
    );
  }
}
