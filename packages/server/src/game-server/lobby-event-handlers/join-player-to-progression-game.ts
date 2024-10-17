import {
  ClientToServerEventTypes,
  Combatant,
  ERROR_MESSAGES,
  ServerToClientEvent,
  ServerToClientEventTypes,
  SpeedDungeonGame,
  addCharacterToParty,
  getProgressionGamePartyName,
} from "@speed-dungeon/common";
import { GameServer } from "..";
import errorHandler from "../error-handler.js";
import { BrowserTabSession } from "../socket-connection-metadata.js";
import SocketIO from "socket.io";
import joinPlayerToGame from "./join-player-to-game.js";

export default async function joinPlayerToProgressionGame(
  gameServer: GameServer,
  socket: SocketIO.Socket<ClientToServerEventTypes, ServerToClientEventTypes>,
  socketMeta: BrowserTabSession,
  game: SpeedDungeonGame,
  character: Combatant
) {
  joinPlayerToGame(gameServer, game, socketMeta, socket);

  const partyName = getProgressionGamePartyName(game.name);
  gameServer.joinPartyHandler(socket.id, partyName);

  const playerOption = game.players[socketMeta.username];
  if (playerOption === undefined)
    return errorHandler(socket, ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);
  addCharacterToParty(game, playerOption, character);

  gameServer.io
    .of("/")
    .in(game.name)
    .emit(ServerToClientEvent.CharacterAddedToParty, partyName, socketMeta.username, character);
}
