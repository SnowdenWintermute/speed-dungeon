import { useGameStore } from "@/stores/game-store";
import { DetailableEntityType } from "@/stores/game-store/detailable-entities";
import { Item } from "@speed-dungeon/common";

export default function selectItem(itemOption: null | Item) {
  useGameStore.getState().mutateState((gameState) => {
    if (itemOption) {
      if (
        gameState.detailedEntity?.type === DetailableEntityType.Item &&
        gameState.detailedEntity.item.entityProperties.id === itemOption.entityProperties.id
      ) {
        gameState.detailedEntity = null;
        gameState.actionMenuParentPageNumbers.pop();
      } else {
        gameState.detailedEntity = { type: DetailableEntityType.Item, item: itemOption };
        gameState.actionMenuParentPageNumbers.push(gameState.actionMenuCurrentPageNumber);
        gameState.actionMenuCurrentPageNumber = 0;
      }
    }

    gameState.hoveredEntity = null;
  });
}
