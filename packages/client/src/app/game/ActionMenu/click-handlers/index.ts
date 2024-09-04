import { GameAction, GameActionType } from "../game-actions";
import { GameState, MenuContext } from "@/stores/game-store";
import { UIState } from "@/stores/ui-store";
import { PartyClientSocket } from "@/stores/websocket-store";
import { MutateState } from "@/stores/mutate-state";
import { AlertState } from "@/stores/alert-store";
import { ClientToServerEvent } from "@speed-dungeon/common";
import getItemOwnedByFocusedCharacter from "@/utils/getItemOwnedByFocusedCharacter";
import selectItem from "@/utils/selectItem";
import { setAlert } from "@/app/components/alerts";
import useItemHandler from "./use-item-handler";
import selectCombatActionHandler from "./select-combat-action-handler";
import cycleCombatActionTargetsHandler from "./cycle-combat-action-targets-handler";
import cycleTargetingSchemeHandler from "./cycle-targeting-scheme-handler";
import useSelectedCombatActionHandler from "./use-selected-combat-action-handler";
import dropItemHandler from "./drop-item-handler";
import getItemOnGround from "@/utils/getItemOnGround";

export default function createActionButtonClickHandler(
  gameAction: GameAction,
  gameState: GameState,
  uiState: UIState,
  mutateAlertState: MutateState<AlertState>,
  socket: PartyClientSocket
) {
  const mutateGameState = gameState.mutateState;

  if (gameState.combatantModelsAwaitingSpawn.length)
    return () => {
      console.log("awaiting spawn: ", gameState.combatantModelsAwaitingSpawn);
    };

  switch (gameAction.type) {
    case GameActionType.ToggleReadyToExplore:
      return () => socket.emit(ClientToServerEvent.ToggleReadyToExplore);
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
      return () =>
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
          console.log("deselect item clicked");

          if (typeof parentPageOption === "number")
            gameState.actionMenuCurrentPageNumber = parentPageOption;
          else gameState.actionMenuCurrentPageNumber = 0;

          gameState.detailedEntity = null;
          gameState.hoveredEntity = null;
        });
    case GameActionType.SelectItem:
      return () => {
        let itemResult = getItemOwnedByFocusedCharacter(gameState, gameAction.itemId);
        if (itemResult instanceof Error) itemResult = getItemOnGround(gameState, gameAction.itemId);
        if (itemResult instanceof Error) return setAlert(mutateAlertState, itemResult.message);
        selectItem(gameState.mutateState, itemResult);
      };
    case GameActionType.UseItem:
      return () => useItemHandler(gameState, uiState, mutateAlertState, socket);
    case GameActionType.DeselectCombatAction:
      return () => selectCombatActionHandler(gameState, mutateAlertState, socket, null);
    case GameActionType.SelectCombatAction:
      return () =>
        selectCombatActionHandler(gameState, mutateAlertState, socket, gameAction.combatAction);
    case GameActionType.CycleTargets:
      return () =>
        cycleCombatActionTargetsHandler(
          mutateGameState,
          mutateAlertState,
          socket,
          gameAction.nextOrPrevious
        );
    case GameActionType.CycleTargetingScheme:
      return () => cycleTargetingSchemeHandler(mutateGameState, mutateAlertState, socket);
    case GameActionType.UseSelectedCombatAction:
      return () => useSelectedCombatActionHandler(mutateGameState, socket);
    case GameActionType.DropItem:
      return () => dropItemHandler(mutateGameState, mutateAlertState, socket, gameAction.itemId);
    case GameActionType.ToggleReadyToDescend:
      return () => socket.emit(ClientToServerEvent.ToggleReadyToDescend);
    case GameActionType.SetAssignAttributePointsMenuOpen:
      return () =>
        mutateGameState((gameState) => {
          gameState.menuContext = MenuContext.AttributeAssignment;
        });
    case GameActionType.AssignAttributePoint:
      return () =>
        socket.emit(
          ClientToServerEvent.AssignAttributePoint,
          gameState.focusedCharacterId,
          gameAction.attribute
        );
    case GameActionType.TakeItem:
      return () => {};
    case GameActionType.ShardItem:
      return () => {};
  }
}
