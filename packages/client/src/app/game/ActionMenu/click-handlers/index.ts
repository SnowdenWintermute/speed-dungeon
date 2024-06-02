import { GameAction, GameActionType } from "../game-actions";
import { GameState, MenuContext } from "@/stores/game-store";
import { UIState } from "@/stores/ui-store";
import { PartyClientSocket } from "@/stores/websocket-store";
import { MutateState } from "@/stores/mutate-state";
import { AlertState } from "@/stores/alert-store";
import { InPartyClientToServerEvent } from "@speed-dungeon/common";
import getItemOwnedByFocusedCharacter from "@/utils/getItemOwnedByFocusedCharacter";
import selectItem from "@/utils/selectItem";
import { setAlert } from "@/app/components/alerts";
import useItemHandler from "./use-item-handler";
import selectCombatActionHandler from "./select-combat-action-handler";
import cycleCombatActionTargetsHandler from "./cycle-combat-action-targets-handler";

export default function createActionButtonClickHandler(
  gameAction: GameAction,
  gameState: GameState,
  uiState: UIState,
  partySocket: PartyClientSocket,
  mutateAlertState: MutateState<AlertState>
) {
  const mutateGameState = gameState.mutateState;
  switch (gameAction.type) {
    case GameActionType.ToggleReadyToExplore:
      return () => partySocket.emit(InPartyClientToServerEvent.ToggleReadyToExplore);
    case GameActionType.SetInventoryOpen:
      return () =>
        mutateGameState((gameState) => {
          if (gameAction.shouldBeOpen) gameState.menuContext = MenuContext.InventoryItems;
          else gameState.menuContext = null;
          gameState.hoveredEntity = null;
          gameState.comparedItem = null;
          gameState.hoveredAction = null;
          gameState.actionMenuCurrentPageNumber = 0;
        });
    case GameActionType.ToggleViewingEquipedItems:
      mutateGameState((gameState) => {
        if (gameState.menuContext === MenuContext.Equipment)
          gameState.menuContext = MenuContext.InventoryItems;
        else gameState.menuContext = MenuContext.Equipment;
        gameState.actionMenuCurrentPageNumber = 0;
      });
    case GameActionType.DeselectItem:
      return () =>
        mutateGameState((gameState) => {
          let parentPageOption = gameState.actionMenuParentPageNumbers.pop();

          if (typeof parentPageOption === "number")
            gameState.actionMenuCurrentPageNumber = parentPageOption;
          else gameState.actionMenuCurrentPageNumber = 0;

          gameState.selectedItem = null;
          gameState.detailedEntity = null;
        });
    case GameActionType.SelectItem:
      return () => {
        const itemResult = getItemOwnedByFocusedCharacter(gameState, gameAction.itemId);
        if (itemResult instanceof Error) return setAlert(mutateAlertState, itemResult.message);
        selectItem(gameState.mutateState, itemResult);
      };
    case GameActionType.UseItem:
      return () => useItemHandler(gameState, uiState, mutateAlertState, partySocket);
    case GameActionType.DeselectCombatAction:
      return () => selectCombatActionHandler(gameState, mutateAlertState, partySocket, null);
    case GameActionType.SelectCombatAction:
      return () =>
        selectCombatActionHandler(
          gameState,
          mutateAlertState,
          partySocket,
          gameAction.combatAction
        );
    case GameActionType.CycleTargets:
      return () =>
        cycleCombatActionTargetsHandler(
          mutateGameState,
          mutateAlertState,
          partySocket,
          gameAction.nextOrPrevious
        );
    case GameActionType.CycleTargetingScheme:
    case GameActionType.UseSelectedCombatAction:
    case GameActionType.ToggleReadyToDescend:
    case GameActionType.TakeItem:
    case GameActionType.DropItem:
    case GameActionType.ShardItem:
    case GameActionType.SetAssignAttributePointsMenuOpen:
    case GameActionType.AssignAttributePoint:
  }
}
