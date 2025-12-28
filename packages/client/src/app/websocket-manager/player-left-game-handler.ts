import { ActionCommandType } from "@speed-dungeon/common";
import { AppStore } from "@/mobx-stores/app-store";
import { gameWorldView } from "../game-world-view-canvas/SceneManager";
import { ModelActionType } from "@/game-world-view/model-manager/model-actions";

export function playerLeftGameHandler(username: string) {
  gameWorldView.current?.modelManager.modelActionQueue.enqueueMessage({
    type: ModelActionType.ProcessActionCommands,
    actionCommandPayloads: [{ type: ActionCommandType.RemovePlayerFromGame, username }],
  });

  const gameOption = AppStore.get().gameStore.getGameOption();
  if (!gameOption) return;

  const maxStartingFloor = gameOption.getMaxStartingFloor();

  if (gameOption.selectedStartingFloor > maxStartingFloor) {
    gameOption.selectedStartingFloor = maxStartingFloor;
  }
}
