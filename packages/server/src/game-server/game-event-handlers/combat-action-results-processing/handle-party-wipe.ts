import {
  AdventuringParty,
  ERROR_MESSAGES,
  SpeedDungeonGame,
  ServerToClientEvent,
  getPartyChannelName,
  BattleConclusion,
  BattleReport,
  GameMessageType,
} from "@speed-dungeon/common";
import { GameServer } from "../..";

export default function handlePartyWipe(
  this: GameServer,
  game: SpeedDungeonGame,
  party: AdventuringParty
): Error | void {
  if (party.battleId !== null) delete game.battles[party.battleId];

  const socketIdsOfPlayersInOtherPartiesResult = this.getSocketIdsOfPlayersInOtherParties(
    game,
    party
  );
  if (socketIdsOfPlayersInOtherPartiesResult instanceof Error)
    return socketIdsOfPlayersInOtherPartiesResult;
  const socketIdsOfPlayersInOtherParties = socketIdsOfPlayersInOtherPartiesResult;

  for (const socketId of socketIdsOfPlayersInOtherParties) {
    const socketOption = this.io.sockets.sockets.get(socketId);
    if (socketOption === undefined) return new Error(ERROR_MESSAGES.SERVER.SOCKET_NOT_FOUND);
    this.io
      .in(game.name)
      .except(getPartyChannelName(game.name, party.name))
      .emit(ServerToClientEvent.GameMessage, {
        type: GameMessageType.PartyWipe,
        partyName: party.name,
        dlvl: party.currentFloor,
        timeOfWipe: new Date().getTime(),
      });
  }

  this.io
    .in(getPartyChannelName(game.name, party.name))
    .emit(ServerToClientEvent.BattleReport, new BattleReport(BattleConclusion.Defeat));

  for (const username of party.playerUsernames) {
    SpeedDungeonGame.removePlayerFromParty(game, username);
  }
}
