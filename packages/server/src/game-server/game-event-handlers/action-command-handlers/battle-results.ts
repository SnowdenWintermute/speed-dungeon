import {
  BattleConclusion,
  BattleResultActionCommandPayload,
  GameMessageType,
  ServerToClientEvent,
  SpeedDungeonGame,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { GameServer } from "../../index.js";
import { ActionCommandManager } from "@speed-dungeon/common";
import { getGameServer } from "../../../index.js";

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
  const partyChannel = getPartyChannelName(game.name, party.name);

  const maybeError = await gameModeContext.onBattleResult(game, party);
  if (maybeError instanceof Error) return maybeError;

  switch (conclusion) {
    case BattleConclusion.Defeat:
      if (party.battleId !== null) delete game.battles[party.battleId];

      gameServer.io.in(game.name).except(partyChannel).emit(ServerToClientEvent.GameMessage, {
        type: GameMessageType.PartyWipe,
        partyName: party.name,
        dlvl: party.currentFloor,
        timeOfWipe: new Date().getTime(),
      });

      const maybeError = await gameModeContext.onPartyWipe(game, party);
      if (maybeError instanceof Error) return maybeError;

      for (const username of party.playerUsernames)
        SpeedDungeonGame.removePlayerFromParty(game, username);

      break;
    case BattleConclusion.Victory:
      const levelups = SpeedDungeonGame.handleBattleVictory(game, party, payload);
      const onPartyVictoryResult = await gameModeContext.onPartyVictory(game, party, levelups);
      if (onPartyVictoryResult instanceof Error) return onPartyVictoryResult;
      break;
  }

  actionCommandManager.processNextCommand();
}
