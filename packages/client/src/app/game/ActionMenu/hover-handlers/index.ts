import getItemOwnedByFocusedCharacter from "@/utils/getItemOwnedByFocusedCharacter";
import { GameAction, GameActionType } from "../game-actions";
import { GameState } from "@/stores/game-store";
import { DetailableEntityType } from "@/stores/game-store/detailable-entities";
import getItemOnGround from "@/utils/getItemOnGround";

export function createActionButtonMouseEnterHandler(gameState: GameState, action: GameAction) {
  const mutateGameState = gameState.mutateState;
  switch (action.type) {
    case GameActionType.SelectCombatAction:
      return () =>
        mutateGameState((gameState) => {
          gameState.hoveredAction = action.combatAction;
        });
    case GameActionType.SelectItem:
      return () => {
        mutateGameState((gameState) => {
          const itemResult = getItemOwnedByFocusedCharacter(gameState, action.itemId);
          if (!(itemResult instanceof Error)) {
            gameState.hoveredEntity = { type: DetailableEntityType.Item, item: itemResult };
          } else {
            const itemOnGroundResult = getItemOnGround(gameState, action.itemId);
            if (!(itemOnGroundResult instanceof Error)) {
              gameState.hoveredEntity = {
                type: DetailableEntityType.Item,
                item: itemOnGroundResult,
              };
            }
          }
          //
        });
      };
    default:
      return () => {};
  }
}

export function createActionButtonMouseLeaveHandler(gameState: GameState, action: GameAction) {
  const mutateGameState = gameState.mutateState;
  switch (action.type) {
    case GameActionType.SelectItem:
      return () => {
        mutateGameState((gameState) => {
          gameState.hoveredEntity = null;
        });
      };
    case GameActionType.SelectCombatAction:
      return () => {
        mutateGameState((gameState) => {
          gameState.hoveredAction = null;
        });
      };
    default:
      return () => {};
  }
}
