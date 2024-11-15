import { useGameStore } from "@/stores/game-store";
import { Item } from "@speed-dungeon/common";

export default function selectItem(itemOption: null | Item) {
  let detailedItemIsNowNull = true;
  useGameStore.getState().mutateState((gameState) => {
    gameState.hoveredEntity = null;

    if (
      !itemOption ||
      gameState.detailedEntity?.entityProperties.id === itemOption.entityProperties.id
    ) {
      console.log("set detailedEntity null");
      gameState.detailedEntity = null;
      gameState.consideredItemUnmetRequirements = null;
      return;
    }
    console.log("set detailedEntity", itemOption.entityProperties.name);

    gameState.detailedEntity = Item.fromObject(itemOption);
    detailedItemIsNowNull = false;
  });

  return detailedItemIsNowNull;
}
