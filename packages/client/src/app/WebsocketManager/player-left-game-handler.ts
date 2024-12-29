import { ActionCommandType, getProgressionGameMaxStartingFloor } from "@speed-dungeon/common";
import { gameWorld } from "../3d-world/SceneManager";
import { ModelActionType } from "../3d-world/game-world/model-manager/model-actions";
import { useGameStore } from "@/stores/game-store";

export default function playerLeftGameHandler(username: string) {
  console.log("enqueued player left game handler");
  gameWorld.current?.modelManager.modelActionQueue.enqueueMessage({
    type: ModelActionType.ProcessActionCommands,
    actionCommandPayloads: [{ type: ActionCommandType.RemovePlayerFromGame, username }],
  });

  useGameStore.getState().mutateState((state) => {
    if (!state.game) return;

    const maxStartingFloor = getProgressionGameMaxStartingFloor(
      state.game.lowestStartingFloorOptionsBySavedCharacter
    );
    if (state.game.selectedStartingFloor > maxStartingFloor)
      state.game.selectedStartingFloor = maxStartingFloor;
  });
}
