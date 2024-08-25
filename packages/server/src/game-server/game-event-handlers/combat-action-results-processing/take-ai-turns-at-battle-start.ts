import {
  AdventuringParty,
  Battle,
  CombatTurnResult,
  ServerToClientEvent,
  SpeedDungeonGame,
  getPartyChannelName,
} from "@speed-dungeon/common";
import takeAiControlledTurnsIfAppropriate from "./take-ai-controlled-turns-if-appropriate";
import { GameServer } from "../..";

export default function takeAiTurnsAtBattleStart(
  gameServer: GameServer,
  game: SpeedDungeonGame,
  party: AdventuringParty,
  battle: Battle
): Error | void {
  const turnResults: CombatTurnResult[] = [];

  const aiControlledTurnResultsResult = takeAiControlledTurnsIfAppropriate(game, battle);
  console.log("ai controlled turn results at battle start: ", aiControlledTurnResultsResult);
  if (aiControlledTurnResultsResult instanceof Error) return aiControlledTurnResultsResult;
  const aiControlledTurnResults = aiControlledTurnResultsResult;
  turnResults.push(...aiControlledTurnResults);

  if (turnResults.length > 0) {
    gameServer.io
      .in(getPartyChannelName(game.name, party.name))
      .emit(ServerToClientEvent.TurnResults, aiControlledTurnResults);
  }
}
