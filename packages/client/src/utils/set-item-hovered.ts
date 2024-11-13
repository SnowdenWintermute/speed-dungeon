import { useGameStore } from "@/stores/game-store";
import { DetailableEntity, DetailableEntityType } from "@/stores/game-store/detailable-entities";
import { Item } from "@speed-dungeon/common";

export default function setItemHovered(itemOption: null | Item) {
  useGameStore.getState().mutateState((gameState) => {
    if (itemOption === null) gameState.hoveredEntity = null;
    else {
      const entityDetails: DetailableEntity = { type: DetailableEntityType.Item, item: itemOption };
      gameState.hoveredEntity = entityDetails;
    }
  });
}
