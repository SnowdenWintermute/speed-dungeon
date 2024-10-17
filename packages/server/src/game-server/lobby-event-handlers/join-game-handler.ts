import { ERROR_MESSAGES, GameMode, ServerToClientEvent } from "@speed-dungeon/common";
import { GameServer } from "../index.js";
import { SpeedDungeonPlayer } from "@speed-dungeon/common";
import errorHandler from "../error-handler.js";
import { getProgressionGamePartyName } from "./utils.js";
import { fetchSavedCharacters } from "../saved-character-event-handlers/index.js";

export default async function joinGameHandler(
  this: GameServer,
  socketId: string,
  gameName: string
) {
  const [socket, socketMeta] = this.getConnection(socketId);
  if (!socket)
    return errorHandler(socket, "A socket tried to join a game but the socket didn't exist");

  if (socketMeta.currentGameName)
    return socket?.emit(ServerToClientEvent.ErrorMessage, ERROR_MESSAGES.LOBBY.ALREADY_IN_GAME);

  const game = this.games.get(gameName);

  if (!game)
    return socket?.emit(ServerToClientEvent.ErrorMessage, ERROR_MESSAGES.GAME_DOESNT_EXIST);
  if (game.timeStarted)
    return socket?.emit(
      ServerToClientEvent.ErrorMessage,
      ERROR_MESSAGES.LOBBY.GAME_ALREADY_STARTED
    );

  if (game.mode === GameMode.Progression) {
    const charactersResult = await fetchSavedCharacters(this, socket.id);
    if (charactersResult instanceof Error)
      return socket.emit(ServerToClientEvent.ErrorMessage, charactersResult.message);
    if (Object.values(charactersResult).length === 0)
      return errorHandler(socket, ERROR_MESSAGES.GAME.NO_SAVED_CHARACTERS);
  }

  game.players[socketMeta.username] = new SpeedDungeonPlayer(socketMeta.username);

  socketMeta.currentGameName = gameName;

  this.removeSocketFromChannel(socketId, socketMeta.channelName);

  if (game.mode === GameMode.Progression) {
    const partyName = getProgressionGamePartyName(gameName);
    if (!socket) return console.error("Socket not found");
    // If they created the game they would already be in the party
    if (game.players[socketMeta.username]?.partyName !== partyName)
      this.joinPartyHandler(socket.id, partyName);
  } else {
    // players of race mode games can join/create parties as they like
    // just put them in the game channel to start
    this.joinSocketToChannel(socketId, gameName);
  }

  socket.emit(ServerToClientEvent.GameFullUpdate, game);

  this.io
    .of("/")
    .except(socketId)
    .in(game.name)
    .emit(ServerToClientEvent.PlayerJoinedGame, socketMeta.username);
}
