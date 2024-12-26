import { actionCommandQueue } from "@/singletons/action-command-manager";
import { ActionCommandType } from "@speed-dungeon/common";
import { gameWorld } from "../3d-world/SceneManager";

export default function playerLeftGameHandler(username: string) {
  console.log("enqueued player left game handler");
  throw new Error("not implemented");
  // gameWorld.current?.modelManager.modelActionQueue.enqueueMessage({ type: ActionCommandType.RemovePlayerFromGame, username });
}
