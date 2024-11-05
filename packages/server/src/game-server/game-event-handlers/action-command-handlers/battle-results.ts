import {
  BattleConclusion,
  BattleResultActionCommandPayload,
  GameMessageType,
  SpeedDungeonGame,
  createPartyWipeMessage,
} from "@speed-dungeon/common";
import { GameServer } from "../../index.js";
import { ActionCommandManager } from "@speed-dungeon/common";
import { getGameServer } from "../../../singletons.js";
import emitMessageInGameWithOptionalDelayForParty from "../../utils/emit-message-in-game-with-optional-delay-for-party.js";
import leavePartyHandler from "src/game-server/lobby-event-handlers/leave-party-handler.js";

export default async function battleResultActionCommandHandler(
  this: GameServer,
  actionCommandManager: ActionCommandManager,
  gameName: string,
  combatantId: string,
  payload: BattleResultActionCommandPayload
) {
  const gameServer = getGameServer();
  const actionAssociatedDataResult = this.getGamePartyAndCombatant(gameName, combatantId);
  if (actionAssociatedDataResult instanceof Error) return actionAssociatedDataResult;
  const { game, party } = actionAssociatedDataResult;
  const gameModeContext = gameServer.gameModeContexts[game.mode];
  const { conclusion } = payload;

  const maybeError = await gameModeContext.onBattleResult(game, party);
  if (maybeError instanceof Error) return maybeError;

  switch (conclusion) {
    case BattleConclusion.Defeat:
      if (party.battleId !== null) delete game.battles[party.battleId];

      party.timeOfWipe = Date.now();
      emitMessageInGameWithOptionalDelayForParty(
        game.name,
        GameMessageType.PartyWipe,
        createPartyWipeMessage(party.name, party.currentFloor, new Date()),
        party.name
      );

      const maybeError = await gameModeContext.onPartyWipe(game, party);
      if (maybeError instanceof Error) return maybeError;
      break;
    case BattleConclusion.Victory:
      const levelups = SpeedDungeonGame.handleBattleVictory(game, party, payload);
      const onPartyVictoryResult = await gameModeContext.onPartyVictory(game, party, levelups);
      if (onPartyVictoryResult instanceof Error) return onPartyVictoryResult;
      break;
  }

  actionCommandManager.processNextCommand();
}
