import { ActionCommandReceiver, ChangeEquipmentActionCommandPayload } from "@speed-dungeon/common";
import payAbilityCostsActionCommandHandler from "./pay-ability-costs";
import moveIntoCombatActionPositionActionCommandHandler from "./move-into-combat-action-position";
import performCombatActionActionCommandHandler from "./perform-combat-action";
import returnHomeActionCommandHandler from "./return-home";
import battleResultActionCommandHandler from "./process-battle-result";
import { ActionCommandManager } from "@speed-dungeon/common";
import gameMessageActionCommandHandler from "./game-message";

export class ClientActionCommandReceiver implements ActionCommandReceiver {
  constructor() {}

  payAbilityCostsActionCommandHandler = payAbilityCostsActionCommandHandler;

  moveIntoCombatActionPositionActionCommandHandler =
    moveIntoCombatActionPositionActionCommandHandler;
  performCombatActionActionCommandHandler = performCombatActionActionCommandHandler;
  returnHomeActionCommandHandler = returnHomeActionCommandHandler;
  battleResultActionCommandHandler = battleResultActionCommandHandler;

  gameMessageCommandHandler = gameMessageActionCommandHandler;

  changeEquipmentActionCommandHandler: (
    actionCommandManager: ActionCommandManager,
    gameName: string,
    combatantId: string,
    payload: ChangeEquipmentActionCommandPayload
  ) => void = () => {};
}
