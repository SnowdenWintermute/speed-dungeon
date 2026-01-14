import {
  GameServerConnectionInstructions,
  GameHandoffStrategyLobbyToGameServer,
  SpeedDungeonGame,
} from "@speed-dungeon/common";

export class RemoteGameSimuatorHandoffStrategy implements GameHandoffStrategyLobbyToGameServer {
  handoff(game: SpeedDungeonGame): GameServerConnectionInstructions {
    throw new Error("Method not implemented.");
  }
}
