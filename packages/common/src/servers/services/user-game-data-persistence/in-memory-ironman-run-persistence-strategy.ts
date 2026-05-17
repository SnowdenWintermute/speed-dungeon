import { GameId } from "../../../aliases.js";
import { SpeedDungeonGame } from "../../../game/index.js";
import { IronmanRunPersistenceStrategy } from "./saved-ironman-runs.js";

export class InMemoryIronmanRunPersistenceStrategy implements IronmanRunPersistenceStrategy {
  insert(game: SpeedDungeonGame): Promise<void> {
    throw new Error("Method not implemented.");
  }
  update(game: SpeedDungeonGame): Promise<void> {
    throw new Error("Method not implemented.");
  }
  fetchRun(gameId: GameId): Promise<SpeedDungeonGame | undefined> {
    throw new Error("Method not implemented.");
  }
  //
}
