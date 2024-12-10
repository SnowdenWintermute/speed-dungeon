import { ActionCommandType } from "@speed-dungeon/common";
import { enqueueClientActionCommands } from "@/singletons/action-command-manager";

export default function playerLeftGameHandler(username: string) {
  enqueueClientActionCommands("", [{ type: ActionCommandType.RemovePlayerFromGame, username }]);
}
