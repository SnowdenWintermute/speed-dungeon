import { ChangeEquipmentActionCommandPayload } from "@speed-dungeon/common";
import { GameServer } from "../..";
import { ActionCommandManager } from "@speed-dungeon/common/src/action-processing/action-command-manager";

export default function changeEquipmentActionCommandHandler(
  this: GameServer,

  actionCommandManager: ActionCommandManager,
  gameName: string,
  combatantId: string,
  payload: ChangeEquipmentActionCommandPayload
) {
  //
}
