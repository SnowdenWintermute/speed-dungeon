import {
  ActionCommandPayload,
  ActionCommandType,
  BattleConclusion,
  BattleResultActionCommandPayload,
  GameMessageType,
  SpeedDungeonGame,
  createPartyWipeMessage,
} from "@speed-dungeon/common";
import { GameServer } from "../../index.js";
import { getGameServer } from "../../../singletons.js";

export default async function battleResultActionCommandHandler(
  this: GameServer,
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
