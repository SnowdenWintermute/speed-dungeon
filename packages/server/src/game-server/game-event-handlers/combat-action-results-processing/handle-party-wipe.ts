import {
  AdventuringParty,
  Battle,
  ERROR_MESSAGES,
  ClientToServerEventTypes,
  ServerToClientEventTypes,
  SpeedDungeonGame,
  getPlayerParty,
  ServerToClientEvent,
  getPartyChannelName,
  BattleConclusion,
} from "@speed-dungeon/common";
import { GameServer, SocketId } from "../..";
import removePlayerFromParty from "@speed-dungeon/common/src/game/remove-player-from-party";

export default function handlePartyWipe(
  this: GameServer,
  game: SpeedDungeonGame,
  party: AdventuringParty
): Error | void {
  if (party.battleId !== null) delete game.battles[party.battleId];

  const socketIdsOfPlayersInOtherPartiesResult = getSocketIdsOfPlayersInOtherParties(
    this,
    game,
    party
  );
  if (socketIdsOfPlayersInOtherPartiesResult instanceof Error)
    return socketIdsOfPlayersInOtherPartiesResult;
  const socketIdsOfPlayersInOtherParties = socketIdsOfPlayersInOtherPartiesResult;

  for (const socketId of socketIdsOfPlayersInOtherParties) {
    const socketOption = this.io.sockets.sockets.get(socketId);
    if (socketOption === undefined) return new Error(ERROR_MESSAGES.SERVER.SOCKET_NOT_FOUND);
    socketOption.emit(
      ServerToClientEvent.PartyWipe,
      party.name,
      party.currentFloor,
      new Date().getTime()
    );
  }

  this.io
    .in(getPartyChannelName(party.name))
    .emit(ServerToClientEvent.BattleReport, BattleConclusion.Defeat, [], []);

  for (const username of party.playerUsernames) {
    SpeedDungeonGame.removePlayerFromParty(game, username);
  }
}

function getSocketIdsOfPlayersInOtherParties(
  gameServer: GameServer,
  game: SpeedDungeonGame,
  party: AdventuringParty
): Error | SocketId[] {
  const socketIdsOfPlayersInOtherParties: SocketId[] = [];
  for (const [username, player] of Object.entries(game.players)) {
    if (party.playerUsernames.includes(username)) continue;
    const playerSocketIdsOption = gameServer.socketIdsByUsername.get(player.username);
    if (playerSocketIdsOption === undefined)
      return new Error(ERROR_MESSAGES.SERVER.USERNAME_HAS_NO_SOCKET_IDS);
    for (const playerSocketId of playerSocketIdsOption) {
      const associatedSessionOption = gameServer.connections.get(playerSocketId);
      if (associatedSessionOption === undefined)
        return new Error(ERROR_MESSAGES.SERVER.BROWSER_SESSION_NOT_FOUND);
      if (associatedSessionOption.currentPartyName === party.name)
        socketIdsOfPlayersInOtherParties.push(playerSocketId);
    }
  }
  return socketIdsOfPlayersInOtherParties;
}
