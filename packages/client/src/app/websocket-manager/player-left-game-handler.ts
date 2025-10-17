import { ActionCommandType, getProgressionGameMaxStartingFloor } from "@speed-dungeon/common";
import { gameWorld } from "../3d-world/SceneManager";
import { ModelActionType } from "../3d-world/game-world/model-manager/model-actions";
import { AppStore } from "@/mobx-stores/app-store";

export function playerLeftGameHandler(username: string) {
  gameWorld.current?.modelManager.modelActionQueue.enqueueMessage({
    type: ModelActionType.ProcessActionCommands,
    actionCommandPayloads: [{ type: ActionCommandType.RemovePlayerFromGame, username }],
  });

  const gameOption = AppStore.get().gameStore.getGameOption();
  if (!gameOption) return;

  const maxStartingFloor = getProgressionGameMaxStartingFloor(
    gameOption.lowestStartingFloorOptionsBySavedCharacter
  );

  if (gameOption.selectedStartingFloor > maxStartingFloor) {
    gameOption.selectedStartingFloor = maxStartingFloor;
  }
}
