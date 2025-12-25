import { SpeedDungeonGame } from "../game/index.js";

enum GameSimulatorConnectionType {
  Local,
  Remote,
}

export interface LocalGameSimulatorConnectionInstructions {
  type: GameSimulatorConnectionType.Local;
}

export interface RemoteGameSimulatorConnectionInstructions {
  type: GameSimulatorConnectionType.Remote;
  url: string;
  password: string;
}

export type GameSimulatorConnectionInstructions =
  | LocalGameSimulatorConnectionInstructions
  | RemoteGameSimulatorConnectionInstructions;

// give the set up game to a GameSimulator either a locally owned GameSimulator
// on the client or send it over websockets to a GameServer which owns a GameSimulator
export interface GameSimulatorHandoffStrategy {
  handoff(game: SpeedDungeonGame): GameSimulatorConnectionInstructions;

  // @TODO
  // hand off the game to a game simulator and let it take care of the following:
  // - await expected connections from players
  // - handle game mode specific onStart business
  // - trigger the game simulator's "next room exploration" handler to automatically
  //   put parties in their first room of the dungeon
  //
  // let clients know how they should connect to the game simulator and provide them with
  // credentials if needed
  // - tell them the game started
  // - give them connection instructions to the game simulator
  // - give credentials if needed

  // const gameModeContext = gameServer.gameModeContexts[game.mode];
  // await gameModeContext.onGameStart(game);
  // gameServer.io.of("/").in(game.name).emit(ServerToClientEvent.GameStarted, game.timeStarted);
  //
  // for (const player of Object.values(game.players)) {
  //   const socketIdResult = gameServer.getSocketIdOfPlayer(game, player.username);
  //   if (socketIdResult instanceof Error) return socketIdResult;
  //   if (!player.partyName) throw new Error(ERROR_MESSAGES.PLAYER.MISSING_PARTY_NAME);
  //   const partyOption = game.adventuringParties[player.partyName];
  //   if (!partyOption) throw new Error(ERROR_MESSAGES.GAME.PARTY_DOES_NOT_EXIST);
  //   toggleReadyToExploreHandler(undefined, { game, partyOption, player, session });
  // }
}
