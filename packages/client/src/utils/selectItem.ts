import { useGameStore } from "@/stores/game-store";
import { Item } from "@speed-dungeon/common";

export default function selectItem(itemOption: null | Item) {
  useGameStore.getState().mutateState((gameState) => {
    if (itemOption) {
      if (
        gameState.detailedEntity instanceof Item &&
        gameState.detailedEntity.entityProperties.id === itemOption.entityProperties.id
      ) {
        gameState.detailedEntity = null;
        gameState.actionMenuParentPageNumbers.pop();
      } else {
        gameState.detailedEntity = new Item(
          itemOption.entityProperties,
          itemOption.itemLevel,
          itemOption.requirements,
          itemOption.itemProperties
        );
        gameState.actionMenuParentPageNumbers.push(gameState.actionMenuCurrentPageNumber);
        gameState.actionMenuCurrentPageNumber = 0;
      }
    }

    gameState.hoveredEntity = null;
  });
}
