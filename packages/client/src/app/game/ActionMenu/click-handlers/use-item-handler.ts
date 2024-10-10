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
import { DetailableEntityType } from "@/stores/game-store/detailable-entities";
import { websocketConnection } from "@/singletons/websocket-connection";

export default function useItemHandler(
  gameState: GameState,
  uiState: UIState,
  mutateAlertState: MutateState<AlertState>
) {
  const altSlotTargeted = uiState.modKeyHeld;

  const itemOption =
    gameState.detailedEntity?.type === DetailableEntityType.Item
      ? gameState.detailedEntity.item
      : null;
  if (itemOption) {
    switch (itemOption.itemProperties.type) {
      case ItemPropertiesType.Equipment:
        useEquipmentHandler(gameState, itemOption.entityProperties.id, altSlotTargeted);
      case ItemPropertiesType.Consumable:
        selectCombatActionHandler(gameState, mutateAlertState, {
          type: CombatActionType.ConsumableUsed,
          itemId: itemOption.entityProperties.id,
        });
    }
  }
}

function useEquipmentHandler(gameState: GameState, itemId: string, altSlot: boolean) {
  const focusedCharacterResult = getFocusedCharacter(gameState);
  if (focusedCharacterResult instanceof Error) return focusedCharacterResult;
  const focusedCharacter = focusedCharacterResult;
  const slotEquippedOption = CombatantProperties.getSlotItemIsEquippedTo(
    focusedCharacter.combatantProperties,
    itemId
  );
  if (slotEquippedOption !== null) {
    websocketConnection.emit(
      ClientToServerEvent.UnequipSlot,
      focusedCharacter.entityProperties.id,
      slotEquippedOption
    );
  } else {
    websocketConnection.emit(ClientToServerEvent.EquipInventoryItem, {
      characterId: focusedCharacter.entityProperties.id,
      itemId,
      equipToAlternateSlot: altSlot,
    });
  }
}
