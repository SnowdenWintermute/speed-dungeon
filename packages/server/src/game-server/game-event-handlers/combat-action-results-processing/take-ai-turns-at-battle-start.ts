import {
  CombatTurnResult,
  InPartyClientToServerEvent,
  InPartyClientToServerEventTypes,
  InPartyServerToClientEvent,
  InPartyServerToClientEventTypes,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { Socket } from "socket.io";

export default function takeAiTurnsAtBattleStart(
  game: SpeedDungeonGame,
  battleId: string,
  partySocket: Socket<InPartyClientToServerEventTypes, InPartyServerToClientEventTypes>
) {
  const turnResults: CombatTurnResult[] = [];
  const aiControlledTurnResults = takeAiControlledTurnsIfAppropriate();
}
