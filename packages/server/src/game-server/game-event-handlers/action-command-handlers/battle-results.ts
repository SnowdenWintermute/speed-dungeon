import {
  ActionCommandPayload,
  ActionCommandType,
  BattleConclusion,
  BattleResultActionCommandPayload,
  ERROR_MESSAGES,
  GameMessageType,
  SpeedDungeonGame,
  createPartyWipeMessage,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { GameServer } from "../../index.js";
import { getGameServer } from "../../../singletons/index.js";

export async function battleResultActionCommandHandler(
  this: GameServer,
  gameName: string,
  payload: BattleResultActionCommandPayload
) {
  const gameServer = getGameServer();
  const game = this.games.get(gameName);
  if (!game) throw new Error(ERROR_MESSAGES.GAME_DOESNT_EXIST);
  const party = game.adventuringParties[payload.partyName];
  if (!party) throw new Error(ERROR_MESSAGES.GAME.PARTY_DOES_NOT_EXIST);

  const gameModeContext = gameServer.gameModeContexts[game.mode];
  const { conclusion } = payload;

  const gameMessagePayloads: ActionCommandPayload[] = [];

  const maybeError = await gameModeContext.onBattleResult(game, party);
  if (maybeError instanceof Error) return maybeError;

  switch (conclusion) {
    case BattleConclusion.Defeat:
      if (party.battleId !== null) delete game.battles[party.battleId];

      party.timeOfWipe = Date.now();

      gameMessagePayloads.push({
        type: ActionCommandType.GameMessages,
        messages: [
          {
            type: GameMessageType.PartyWipe,
            text: createPartyWipeMessage(party.name, party.currentFloor, new Date()),
          },
        ],
        partyChannelToExclude: getPartyChannelName(game.name, party.name),
      });

      const defeatMessagePayloadResults = await gameModeContext.onPartyWipe(game, party);
      if (defeatMessagePayloadResults instanceof Error) return defeatMessagePayloadResults;
      if (defeatMessagePayloadResults) gameMessagePayloads.push(...defeatMessagePayloadResults);
      break;
    case BattleConclusion.Victory:
      const levelups = SpeedDungeonGame.handleBattleVictory(game, party, payload);
      const victoryMessagePayloadResults = await gameModeContext.onPartyVictory(
        game,
        party,
        levelups
      );
      if (victoryMessagePayloadResults instanceof Error) return victoryMessagePayloadResults;
      if (victoryMessagePayloadResults) gameMessagePayloads.push(...victoryMessagePayloadResults);
      break;
  }
  return gameMessagePayloads;
}
