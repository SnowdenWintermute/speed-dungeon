import {
  ClientToServerEventTypes,
  Combatant,
  ERROR_MESSAGES,
  ServerToClientEvent,
  ServerToClientEventTypes,
  SpeedDungeonGame,
  addCharacterToParty,
} from "@speed-dungeon/common";
import { GameServer } from "..";
import { getProgressionGamePartyName } from "./utils.js";
import errorHandler from "../error-handler.js";
import { BrowserTabSession } from "../socket-connection-metadata";
import SocketIO from "socket.io";

export default async function joinPlayerToProgressionGame(
  gameServer: GameServer,
  socket: SocketIO.Socket<ClientToServerEventTypes, ServerToClientEventTypes>,
  socketMeta: BrowserTabSession,
  game: SpeedDungeonGame,
  character: Combatant
) {
  await gameServer.joinGameHandler(socket.id, game.name);

  const partyName = getProgressionGamePartyName(game.name);
  gameServer.createPartyHandler(socket.id, partyName);

  const playerOption = game.players[socketMeta.username];
  if (playerOption === undefined)
    return errorHandler(socket, ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);
  addCharacterToParty(game, playerOption, character);

  gameServer.io
    .of("/")
    .in(game.name)
    .emit(ServerToClientEvent.CharacterAddedToParty, partyName, socketMeta.username, character);
}
