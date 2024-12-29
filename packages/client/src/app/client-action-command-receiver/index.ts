import {
  ActionCommandReceiver,
  MoveIntoCombatActionPositionActionCommandPayload,
  PerformCombatActionActionCommandPayload,
  ReturnHomeActionCommandPayload,
} from "@speed-dungeon/common";
import payAbilityCostsActionCommandHandler from "./pay-ability-costs";
import battleResultActionCommandHandler from "./process-battle-result";
import gameMessageActionCommandHandler from "./game-message";
import { removeClientPlayerFromGame } from "./remove-client-player-from-game";
import startReturningHome from "../3d-world/game-world/model-manager/start-returning-home";
import startPerformingCombatAction from "../3d-world/game-world/model-manager/start-performing-combat-action";
import startMovingIntoCombatActionUsePosition from "../3d-world/game-world/model-manager/start-moving-into-combat-action-use-position";

export class ClientActionCommandReceiver implements ActionCommandReceiver {
  constructor() {}
  removePlayerFromGameCommandHandler = removeClientPlayerFromGame;
  payAbilityCostsActionCommandHandler = payAbilityCostsActionCommandHandler;
  async moveIntoCombatActionPositionActionCommandHandler(
    _gameName: string,
    combatantId: string,
    payload: MoveIntoCombatActionPositionActionCommandPayload
  ) {
    return startMovingIntoCombatActionUsePosition(combatantId, payload);
  }
  async performCombatActionActionCommandHandler(
    _gameName: string,
    combatantId: string,
    payload: PerformCombatActionActionCommandPayload
  ) {
    return startPerformingCombatAction(combatantId, payload);
  }
  async returnHomeActionCommandHandler(
    _gameName: string,
    combatantId: string,
    payload: ReturnHomeActionCommandPayload
  ) {
    return startReturningHome(combatantId, payload);
  }
  battleResultActionCommandHandler = battleResultActionCommandHandler;

  gameMessageCommandHandler = gameMessageActionCommandHandler;
}
