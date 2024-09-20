import { ChangeEquipmentActionCommandPayload } from "@speed-dungeon/common";
import { GameServer } from "../../index.js";
import { ActionCommandManager } from "@speed-dungeon/common";

export default function changeEquipmentActionCommandHandler(
  this: GameServer,

  actionCommandManager: ActionCommandManager,
  gameName: string,
  combatantId: string,
  payload: ChangeEquipmentActionCommandPayload
) {
  //
}
