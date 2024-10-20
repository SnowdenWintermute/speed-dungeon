import { setAlert } from "@/app/components/alerts";
import { websocketConnection } from "@/singletons/websocket-connection";
import { AlertState } from "@/stores/alert-store";
import { GameState } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";
import getFocusedCharacter from "@/utils/getFocusedCharacter";
import { CombatantProperties, ClientToServerEvent } from "@speed-dungeon/common";

export default function dropItemHandler(
  mutateGameState: MutateState<GameState>,
  mutateAlertState: MutateState<AlertState>,
  itemId: string
) {
  mutateGameState((gameState) => {
    const focusedCharacterResult = getFocusedCharacter(gameState);
    if (focusedCharacterResult instanceof Error)
      return setAlert(mutateAlertState, focusedCharacterResult.message);
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
