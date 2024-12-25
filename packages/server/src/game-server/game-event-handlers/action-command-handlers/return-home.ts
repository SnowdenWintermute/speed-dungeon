import {
  ERROR_MESSAGES,
  ReturnHomeActionCommandPayload,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { GameServer } from "../../index.js";

export default async function returnHomeActionCommandHandler(
  this: GameServer,
  gameName: string,
  combatantId: string,
  payload: ReturnHomeActionCommandPayload
) {
  const { shouldEndTurn } = payload;
  const actionAssociatedDataResult = this.getGamePartyAndCombatant(gameName, combatantId);
  if (actionAssociatedDataResult instanceof Error) return actionAssociatedDataResult;
  const { game, party } = actionAssociatedDataResult;

  if (party.battleId !== null && shouldEndTurn) {
    const battleOption = SpeedDungeonGame.getBattleOption(game, party.battleId);
    if (!battleOption) return new Error(ERROR_MESSAGES.GAME.BATTLE_DOES_NOT_EXIST);
    // @todo - if this combatant is dead that means they killed themselves on their own turn
    // which means their turn tracker was already removed, so we'll need to custom handle that
    const maybeError = SpeedDungeonGame.endActiveCombatantTurn(game, battleOption);
    if (maybeError instanceof Error) return maybeError;
  }
}
