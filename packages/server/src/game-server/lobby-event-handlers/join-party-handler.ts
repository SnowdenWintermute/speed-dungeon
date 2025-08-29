import {
  ERROR_MESSAGES,
  ServerToClientEvent,
  SpeedDungeonGame,
  getPartyChannelName,
} from "@speed-dungeon/common";
import errorHandler from "../error-handler.js";
import { Socket } from "socket.io";
import { getGameServer } from "../../singletons/index.js";
import { ServerPlayerAssociatedData } from "../event-middleware/index.js";

export default function joinPartyHandler(
  partyName: string,
  playerAssociatedData: ServerPlayerAssociatedData,
  socket: Socket
) {
  const gameServer = getGameServer();
  const { game, player, session } = playerAssociatedData;
  if (player.partyName)
    return errorHandler(socket, new Error(ERROR_MESSAGES.LOBBY.ALREADY_IN_PARTY));

  SpeedDungeonGame.putPlayerInParty(game, partyName, player.username);
  const partyChannelName = getPartyChannelName(game.name, partyName);
  gameServer.joinSocketToChannel(socket.id, partyChannelName);
  session.currentPartyName = partyName;
  socket?.emit(ServerToClientEvent.PartyNameUpdate, partyName);

  gameServer.io
    .of("/")
    .to(game.name)
    .emit(ServerToClientEvent.PlayerChangedAdventuringParty, session.username, partyName);
}
