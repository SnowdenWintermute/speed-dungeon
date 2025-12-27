import {
  GameSimulatorConnectionInstructions,
  GameSimulatorHandoffStrategy,
  SpeedDungeonGame,
} from "@speed-dungeon/common";

export class RemoteGameSimuatorHandoffStrategy implements GameSimulatorHandoffStrategy {
  handoff(game: SpeedDungeonGame): GameSimulatorConnectionInstructions {
    throw new Error("Method not implemented.");
    // @TODO
    // hand off the game to a game simulator and let it take care of the following:
    // - await expected connections from players
    // - handle game mode specific onStart business
    // - trigger the game simulator's "next room exploration" handler to automatically
    //   put parties in their first room of the dungeon
    //
    // AT CALL SITE
    // let clients know how they should connect to the game simulator and provide them with
    // credentials if needed
    // - tell them the game started
    // - give them connection instructions to the game simulator
    // - give credentials if needed
  }
}
