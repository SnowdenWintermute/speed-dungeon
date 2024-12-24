import {
  ActionCommandReceiver,
  ChangeEquipmentActionCommandPayload,
  MoveIntoCombatActionPositionActionCommandPayload,
  PerformCombatActionActionCommandPayload,
  ReturnHomeActionCommandPayload,
} from "@speed-dungeon/common";
import payAbilityCostsActionCommandHandler from "./pay-ability-costs";
import battleResultActionCommandHandler from "./process-battle-result";
import { ActionCommandManager } from "@speed-dungeon/common";
import gameMessageActionCommandHandler from "./game-message";
import { removeClientPlayerFromGame } from "./remove-client-player-from-game";
import startReturningHome from "../3d-world/game-world/model-manager/start-returning-home";
import startPerformingCombatAction from "../3d-world/game-world/model-manager/start-performing-combat-action";
import startMovingIntoCombatActionUsePosition from "../3d-world/game-world/model-manager/start-moving-into-combat-action-use-position";

export class ClientActionCommandReceiver implements ActionCommandReceiver {
  constructor() {}
  removePlayerFromGameCommandHandler = removeClientPlayerFromGame;
  payAbilityCostsActionCommandHandler = payAbilityCostsActionCommandHandler;
  moveIntoCombatActionPositionActionCommandHandler(
    _actionCommandManager: ActionCommandManager,
    _gameName: string,
    combatantId: string,
    payload: MoveIntoCombatActionPositionActionCommandPayload
  ) {
    startMovingIntoCombatActionUsePosition(combatantId, payload);
  }
  performCombatActionActionCommandHandler(
    _actionCommandManager: ActionCommandManager,
    _gameName: string,
    combatantId: string,
    payload: PerformCombatActionActionCommandPayload
  ) {
    startPerformingCombatAction(combatantId, payload);
  }
  returnHomeActionCommandHandler(
    _actionCommandManager: ActionCommandManager,
    _gameName: string,
    combatantId: string,
    payload: ReturnHomeActionCommandPayload
  ) {
    startReturningHome(combatantId, payload);
  }
  battleResultActionCommandHandler = battleResultActionCommandHandler;

  gameMessageCommandHandler = gameMessageActionCommandHandler;

  changeEquipmentActionCommandHandler: (
    actionCommandManager: ActionCommandManager,
    gameName: string,
    combatantId: string,
    payload: ChangeEquipmentActionCommandPayload
  ) => void = () => {};
}
