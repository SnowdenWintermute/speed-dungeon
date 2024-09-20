import {
  ERROR_MESSAGES,
  ServerToClientEvent,
  SpeedDungeonGame,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { GameServer } from "../index.js";
import errorHandler from "../error-handler.js";

export default function joinPartyHandler(this: GameServer, socketId: string, partyName: string) {
  const [socket, socketMeta] = this.getConnection(socketId);
  if (!socketMeta.currentGameName)
    return errorHandler(
      socket,
      "A client tried to join a party but they didn't know their own game name"
    );
  const game = this.games.get(socketMeta.currentGameName);
  if (!game)
    return errorHandler(
      socket,
      "A client tried to join a party but their supposed game didn't exist"
    );
  const player = game.players[socketMeta.username];
  if (!player)
    return errorHandler(
      socket,
      "A client tried to join a party but their game didn't include them in the player list"
    );
  if (player.partyName) return errorHandler(socket, ERROR_MESSAGES.LOBBY.ALREADY_IN_PARTY);

  SpeedDungeonGame.putPlayerInParty(game, partyName, player.username);
  const partyChannelName = getPartyChannelName(game.name, partyName);
  this.joinSocketToChannel(socketId, partyChannelName);
  socketMeta.channelName = partyChannelName;
  socketMeta.currentPartyName = partyName;
  socket?.emit(ServerToClientEvent.PartyNameUpdate, partyName);

  this.io
    .of("/")
    .to(game.name)
    .emit(ServerToClientEvent.PlayerChangedAdventuringParty, socketMeta.username, partyName);
}
