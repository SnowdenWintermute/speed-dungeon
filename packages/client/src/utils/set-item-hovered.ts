import { GameState } from "@/stores/game-store";
import { DetailableEntity, DetailableEntityType } from "@/stores/game-store/detailable-entities";
import { MutateState } from "@/stores/mutate-state";
import { Item } from "@speed-dungeon/common";

export default function setItemHovered(
  mutateGameState: MutateState<GameState>,
  itemOption: null | Item
) {
  mutateGameState((gameState) => {
    if (itemOption === null) gameState.hoveredEntity = null;
    else {
      const entityDetails: DetailableEntity = { type: DetailableEntityType.Item, item: itemOption };
      gameState.hoveredEntity = entityDetails;
    }
  });
}
