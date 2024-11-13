import { setAlert } from "@/app/components/alerts";
import { websocketConnection } from "@/singletons/websocket-connection";
import { useGameStore } from "@/stores/game-store";
import getFocusedCharacter from "@/utils/getFocusedCharacter";
import { CombatantProperties, ClientToServerEvent } from "@speed-dungeon/common";

export default function dropItemHandler(itemId: string) {
  useGameStore.getState().mutateState((gameState) => {
    const focusedCharacterResult = getFocusedCharacter(gameState);
    if (focusedCharacterResult instanceof Error) return setAlert(focusedCharacterResult.message);
    const focusedCharacter = focusedCharacterResult;
    const slotItemIsEquipped = CombatantProperties.getSlotItemIsEquippedTo(
      focusedCharacter.combatantProperties,
      itemId
    );

    const characterId = focusedCharacter.entityProperties.id;

    if (slotItemIsEquipped !== null) {
      websocketConnection.emit(ClientToServerEvent.DropEquippedItem, {
        characterId,
        slot: slotItemIsEquipped,
      });
    } else {
      websocketConnection.emit(ClientToServerEvent.DropItem, { characterId, itemId });
    }

    gameState.detailedEntity = null;
    gameState.hoveredEntity = null;
    const previousActionMenuPageNumberOption = gameState.actionMenuParentPageNumbers.pop();
    if (typeof previousActionMenuPageNumberOption === "number")
      gameState.actionMenuCurrentPageNumber = previousActionMenuPageNumberOption;
    else gameState.actionMenuCurrentPageNumber = 0;
  });
}
