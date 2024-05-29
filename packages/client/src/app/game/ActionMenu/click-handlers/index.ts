import { GameAction, GameActionType } from "../game-actions";
import { GameState, MenuContext } from "@/stores/game-store";
import { UIState } from "@/stores/ui-store";
import { LobbyState } from "@/stores/lobby-store";
import { PartyClientSocket } from "@/stores/websocket-store";
import { MutateState } from "@/stores/mutate-state";
import { AlertState } from "@/stores/alert-store";
import { InPartyClientToServerEvent } from "@speed-dungeon/common";
import getItemOwnedByFocusedCharacter from "@/utils/getItemOwnedByFocusedCharacter";

export default function createActionButtonClickHandler(
  gameAction: GameAction,
  gameState: GameState,
  uiState: UIState,
  lobbyState: LobbyState,
  partySocketOption: undefined | PartyClientSocket,
  mutateAlertState: MutateState<AlertState>
) {
  const mutateGameState = gameState.mutateState;
  switch (gameAction.type) {
    case GameActionType.ToggleReadyToExplore:
      partySocketOption?.emit(InPartyClientToServerEvent.ToggleReadyToExplore);
      break;
    case GameActionType.SetInventoryOpen:
      mutateGameState((gameState) => {
        if (gameAction.shouldBeOpen) gameState.menuContext = MenuContext.InventoryItems;
        else gameState.menuContext = null;
        gameState.hoveredEntity = null;
        gameState.comparedItem = null;
        gameState.hoveredAction = null;
        gameState.actionMenuCurrentPageNumber = 0;
      });
      break;
    case GameActionType.ToggleViewingEquipedItems:
      mutateGameState((gameState) => {
        if (gameState.menuContext === MenuContext.Equipment)
          gameState.menuContext = MenuContext.InventoryItems;
        else gameState.menuContext = MenuContext.Equipment;
        gameState.actionMenuCurrentPageNumber = 0;
      });
    case GameActionType.DeselectItem:
      mutateGameState((gameState) => {
        let parentPageOption = gameState.actionMenuParentPageNumbers.pop();

        if (typeof parentPageOption === "number")
          gameState.actionMenuCurrentPageNumber = parentPageOption;
        else gameState.actionMenuCurrentPageNumber = 0;

        gameState.selectedItem = null;
        gameState.detailedEntity = null;
      });
      break;
    case GameActionType.SelectItem:
      const itemResult = getItemOwnedByFocusedCharacter(
        gameState,
        lobbyState.username,
        gameAction.itemId
      );
    case GameActionType.ToggleReadyToDescend:
    case GameActionType.TakeItem:
    case GameActionType.UseItem:
    case GameActionType.DropItem:
    case GameActionType.ShardItem:
    case GameActionType.UseSelectedCombatAction:
    case GameActionType.SelectCombatAction:
    case GameActionType.DeselectCombatAction:
    case GameActionType.CycleTargets:
    case GameActionType.CycleTargetingScheme:
    case GameActionType.SetAssignAttributePointsMenuOpen:
    case GameActionType.AssignAttributePoint:
  }
}
