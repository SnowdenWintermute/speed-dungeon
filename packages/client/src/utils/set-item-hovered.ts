import { useGameStore } from "@/stores/game-store";
import { Item } from "@speed-dungeon/common";

export default function setItemHovered(itemOption: null | Item) {
  useGameStore.getState().mutateState((gameState) => {
    if (!itemOption) gameState.hoveredEntity = itemOption;
    else gameState.hoveredEntity = itemOption;
  });
}
