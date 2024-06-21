import {
  Battle,
  CombatTurnResult,
  InPartyClientToServerEventTypes,
  InPartyServerToClientEvent,
  InPartyServerToClientEventTypes,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { Socket } from "socket.io";
import takeAiControlledTurnsIfAppropriate from "./take-ai-controlled-turns-if-appropriate";

export default function takeAiTurnsAtBattleStart(
  game: SpeedDungeonGame,
  battle: Battle,
  partySocket: Socket<InPartyClientToServerEventTypes, InPartyServerToClientEventTypes>
): Error | void {
  const turnResults: CombatTurnResult[] = [];

  const aiControlledTurnResultsResult = takeAiControlledTurnsIfAppropriate(game, battle);
  if (aiControlledTurnResultsResult instanceof Error) return aiControlledTurnResultsResult;
  const aiControlledTurnResults = aiControlledTurnResultsResult;
  turnResults.push(...aiControlledTurnResults);

  if (turnResults.length > 0) {
    partySocket.emit(InPartyServerToClientEvent.TurnResults, aiControlledTurnResults);
  }
}
