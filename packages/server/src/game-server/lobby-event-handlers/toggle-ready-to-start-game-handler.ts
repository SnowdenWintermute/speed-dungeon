import { ERROR_MESSAGES, ServerToClientEvent, removeFromArray } from "@speed-dungeon/common";
import { GameServer } from "..";
import errorHandler from "../error-handler";

export default function toggleReadyToStartGameHandler(this: GameServer, socketId: string) {
  const [socket, socketMeta] = this.getConnection(socketId);
  const { username } = socketMeta;
  try {
    const gameName = socketMeta.currentGameName;
    if (!gameName) throw new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
    const game = this.games.get(gameName);
    if (!game) throw new Error(ERROR_MESSAGES.GAME_DOESNT_EXIST);
    if (game.timeStarted) throw new Error(ERROR_MESSAGES.LOBBY.GAME_ALREADY_STARTED);

    if (Object.keys(game.adventuringParties).length < 1)
      throw new Error("A game must have at least one Adventuring Party before it can start");

    Object.values(game.adventuringParties).forEach((party) => {
      if (party.characterPositions.length < 1)
        throw new Error("Each party must have at least one character");
    });

    if (game.playersReadied.includes(username)) removeFromArray(game.playersReadied, username);
    else game.playersReadied.push(username);

    let allPlayersReadied = true;

    Object.keys(game.players).forEach((usernameInGame) => {
      if (game.playersReadied.includes(usernameInGame)) {
        return;
      }
      allPlayersReadied = false;
    });

    if (allPlayersReadied) {
      // @TODO - toggle ready to explore for all
      //
      game.timeStarted = Date.now();
      this.io.of("/").in(game.name).emit(ServerToClientEvent.GameStarted, game.timeStarted);
    }

    this.io.of("/").in(game.name).emit(ServerToClientEvent.PlayerToggledReadyToStartGame, username);
  } catch (e) {
    if (e instanceof Error) errorHandler(socket, e.message);
    else console.error(e);
  }
}
