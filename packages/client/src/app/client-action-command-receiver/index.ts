import { ActionCommandReceiver, ChangeEquipmentActionCommandPayload } from "@speed-dungeon/common";
import payAbilityCostsActionCommandHandler from "./pay-ability-costs";
import moveIntoCombatActionPositionActionCommandHandler from "./move-into-combat-action-position";
import performCombatActionActionCommandHandler from "./perform-combat-action";
import returnHomeActionCommandHandler from "./return-home";
import battleResultActionCommandHandler from "./process-battle-result";
import { ActionCommandManager } from "@speed-dungeon/common";
import gameMessageActionCommandHandler from "./game-message";
import { removeClientPlayerFromGame } from "./remove-client-player-from-game";

export class ClientActionCommandReceiver implements ActionCommandReceiver {
  constructor() {}
  removePlayerFromGameCommandHandler = removeClientPlayerFromGame;
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
