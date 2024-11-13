import getItemOwnedByFocusedCharacter from "@/utils/getItemOwnedByFocusedCharacter";
import { GameAction, GameActionType } from "../game-actions";
import { GameState, useGameStore } from "@/stores/game-store";
import { DetailableEntityType } from "@/stores/game-store/detailable-entities";
import getItemOnGround from "@/utils/getItemOnGround";
import { CombatAttribute, CombatantProperties } from "@speed-dungeon/common";
import { setAlert } from "@/app/components/alerts";

export function createActionButtonMouseEnterHandler(action: GameAction) {
  const gameState = useGameStore.getState();
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
          let itemResult = getItemOwnedByFocusedCharacter(gameState, action.itemId);
          if (!(itemResult instanceof Error)) {
            gameState.hoveredEntity = { type: DetailableEntityType.Item, item: itemResult };
          } else {
            itemResult = getItemOnGround(gameState, action.itemId);
            if (!(itemResult instanceof Error)) {
              gameState.hoveredEntity = {
                type: DetailableEntityType.Item,
                item: itemResult,
              };
            }
          }

          if (itemResult instanceof Error) return setAlert(itemResult.message);

          // calculate unmet requirements
          const focusedCharacterResult = gameState.getFocusedCharacter();
          if (focusedCharacterResult instanceof Error) return focusedCharacterResult;
          const focusedCharacter = focusedCharacterResult;
          const totalAttributes = CombatantProperties.getTotalAttributes(
            focusedCharacter.combatantProperties
          );

          const unmetAttributeRequirements: CombatAttribute[] = [];
          if (Object.keys(itemResult.requirements).length !== 0) {
            for (const [attributeKey, value] of Object.entries(itemResult.requirements)) {
              const attribute = parseInt(attributeKey) as CombatAttribute;
              const characterAttribute = totalAttributes[attribute] || 0;
              if (characterAttribute >= value) continue;
              else unmetAttributeRequirements.push(attribute);
            }
          }

          if (unmetAttributeRequirements.length > 0)
            gameState.consideredItemUnmetRequirements = unmetAttributeRequirements;
          else gameState.consideredItemUnmetRequirements = null;
        });
      };
    default:
      return () => {};
  }
}

export function createActionButtonMouseLeaveHandler(action: GameAction) {
  const mutateGameState = useGameStore.getState().mutateState;
  switch (action.type) {
    case GameActionType.SelectItem:
      return () => {
        mutateGameState((gameState) => {
          gameState.hoveredEntity = null;
          gameState.consideredItemUnmetRequirements = null;
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
