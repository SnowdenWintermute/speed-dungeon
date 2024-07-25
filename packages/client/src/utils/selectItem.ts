import { GameState } from "@/stores/game-store";
import { DetailableEntityType } from "@/stores/game-store/detailable-entities";
import { MutateState } from "@/stores/mutate-state";
import { Item } from "@speed-dungeon/common";

export default function selectItem(
  mutateGameState: MutateState<GameState>,
  itemOption: null | Item
) {
  mutateGameState((gameState) => {
    if (itemOption) {
      if (
        gameState.detailedEntity?.type === DetailableEntityType.Item &&
        gameState.detailedEntity.item.entityProperties.id === itemOption.entityProperties.id
      ) {
        gameState.detailedEntity = null;
        gameState.actionMenuParentPageNumbers.pop();
      } else {
        gameState.actionMenuParentPageNumbers.push(gameState.actionMenuCurrentPageNumber);
        gameState.actionMenuCurrentPageNumber = 0;
        gameState.detailedEntity = { type: DetailableEntityType.Item, item: itemOption };
      }
    }

    gameState.hoveredEntity = null;
  });
}
