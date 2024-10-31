import {
  GameMessageType,
  LOBBY_CHANNEL,
  ServerToClientEvent,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import leavePartyHandler from "./leave-party-handler.js";
import { ServerPlayerAssociatedData } from "../event-middleware/index.js";
import { Socket } from "socket.io";
import { getGameServer } from "../../index.js";

export default async function leaveGameHandler(
  _eventData: undefined,
  playerAssociatedData: ServerPlayerAssociatedData,
  socket: Socket
) {
  const gameServer = getGameServer();
  const { game, partyOption, player, session } = playerAssociatedData;
  const gameModeContext = gameServer.gameModeContexts[game.mode];

  const maybeError = gameModeContext.onGameLeave(game, partyOption, player);
  if (maybeError instanceof Error) return maybeError;

  leavePartyHandler(undefined, playerAssociatedData, socket);

  SpeedDungeonGame.removePlayer(game, session.username);
  const gameNameLeaving = game.name;
  session.currentGameName = null;

  if (Object.keys(game.players).length === 0) {
    const maybeError = await gameModeContext.onLastPlayerLeftGame(game);
    if (maybeError instanceof Error) return maybeError;
    gameServer.games.remove(game.name);
  }

  gameServer.removeSocketFromChannel(socket.id, gameNameLeaving);
  gameServer.joinSocketToChannel(socket.id, LOBBY_CHANNEL);
  if (gameServer.games.get(gameNameLeaving)) {
    gameServer.io
      .of("/")
      .in(gameNameLeaving)
      .emit(ServerToClientEvent.PlayerLeftGame, session.username);
  }
  socket?.emit(ServerToClientEvent.GameFullUpdate, null);
}
