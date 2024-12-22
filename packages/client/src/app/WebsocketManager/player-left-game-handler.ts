import { ActionCommandType } from "@speed-dungeon/common";
import { enqueueClientActionCommands } from "@/singletons/action-command-manager";

export default function playerLeftGameHandler(username: string) {
  console.log("enqueued player left game handler");
  enqueueClientActionCommands("", [{ type: ActionCommandType.RemovePlayerFromGame, username }]);
}
