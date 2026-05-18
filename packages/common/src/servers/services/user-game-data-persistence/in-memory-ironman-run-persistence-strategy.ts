import { GameId } from "../../../aliases.js";
import { SerializedOf } from "../../../serialization/index.js";
import { IronmanRunPersistenceStrategy, SavedIronmanRun } from "./saved-ironman-runs.js";

export class InMemoryIronmanRunPersistenceStrategy implements IronmanRunPersistenceStrategy {
  save(run: SerializedOf<SavedIronmanRun>): Promise<void> {
    throw new Error("Method not implemented.");
  }
  fetchRunOption(runId: GameId): Promise<SerializedOf<SavedIronmanRun> | undefined> {
    throw new Error("Method not implemented.");
  }
  delete(runId: GameId): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
