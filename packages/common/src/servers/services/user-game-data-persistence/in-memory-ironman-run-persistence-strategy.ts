import { GameId } from "../../../aliases.js";
import { SerializedOf } from "../../../serialization/index.js";
import { IronmanRunPersistenceStrategy, SavedIronmanRun } from "./saved-ironman-runs.js";

export class InMemoryIronmanRunPersistenceStrategy implements IronmanRunPersistenceStrategy {
  private runs = new Map<GameId, SerializedOf<SavedIronmanRun>>();

  async save(run: SerializedOf<SavedIronmanRun>): Promise<void> {
    this.runs.set(run._game.id, run);
  }

  async fetchRunOption(runId: GameId): Promise<SerializedOf<SavedIronmanRun> | undefined> {
    return this.runs.get(runId);
  }

  async delete(runId: GameId): Promise<void> {
    this.runs.delete(runId);
  }
}
