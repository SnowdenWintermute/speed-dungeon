import {
  AdventuringParty,
  Battle,
  ClientToServerEventTypes,
  CombatTurnResult,
  ServerToClientEvent,
  ServerToClientEventTypes,
  SpeedDungeonGame,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { Socket } from "socket.io";
import takeAiControlledTurnsIfAppropriate from "./take-ai-controlled-turns-if-appropriate";

export default function takeAiTurnsAtBattleStart(
  game: SpeedDungeonGame,
  party: AdventuringParty,
  battle: Battle,
  socket: Socket<ClientToServerEventTypes, ServerToClientEventTypes>
): Error | void {
  const turnResults: CombatTurnResult[] = [];

  const aiControlledTurnResultsResult = takeAiControlledTurnsIfAppropriate(game, battle);
  if (aiControlledTurnResultsResult instanceof Error) return aiControlledTurnResultsResult;
  const aiControlledTurnResults = aiControlledTurnResultsResult;
  turnResults.push(...aiControlledTurnResults);

  if (turnResults.length > 0) {
    socket
      .in(getPartyChannelName(party.name))
      .emit(ServerToClientEvent.TurnResults, aiControlledTurnResults);
  }
}
