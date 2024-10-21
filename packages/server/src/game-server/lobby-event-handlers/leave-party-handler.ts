import { ServerToClientEvent, SpeedDungeonGame, getPartyChannelName } from "@speed-dungeon/common";
import { Socket } from "socket.io";
import { ServerPlayerAssociatedData } from "../event-middleware/index.js";
import { getGameServer } from "../../index.js";

export default function leavePartyHandler(
  _eventData: undefined,
  playerAssociatedData: ServerPlayerAssociatedData,
  socket: Socket
) {
  const gameServer = getGameServer();
  const { game, player, session } = playerAssociatedData;
  const { username } = player;

  const partyNameLeaving = SpeedDungeonGame.removePlayerFromParty(game, username);
  if (!partyNameLeaving) return;

  const partyChannelName = getPartyChannelName(game.name, partyNameLeaving);
  gameServer.removeSocketFromChannel(socket.id, partyChannelName);
  session.currentPartyName = null;

  socket.emit(ServerToClientEvent.PartyNameUpdate, null);
  gameServer.io
    .of("/")
    .in(game.name)
    .emit(ServerToClientEvent.PlayerChangedAdventuringParty, username, null);
}
