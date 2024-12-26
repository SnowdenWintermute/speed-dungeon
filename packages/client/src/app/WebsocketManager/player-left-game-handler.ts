import { ActionCommandType } from "@speed-dungeon/common";
import { gameWorld } from "../3d-world/SceneManager";
import { ModelActionType } from "../3d-world/game-world/model-manager/model-actions";

export default function playerLeftGameHandler(username: string) {
  console.log("enqueued player left game handler");
  gameWorld.current?.modelManager.modelActionQueue.enqueueMessage({
    type: ModelActionType.ProcessActionCommands,
    actionCommandPayloads: [{ type: ActionCommandType.RemovePlayerFromGame, username }],
  });
}
