import cloneDeep from "lodash.clonedeep";
import { GameId } from "../../../aliases.js";
import { SerializedOf } from "../../../serialization/index.js";
import { IronmanRunPersistenceStrategy, SavedIronmanRun } from "./saved-ironman-runs.js";

export class InMemoryIronmanRunPersistenceStrategy implements IronmanRunPersistenceStrategy {
  private runs = new Map<GameId, SerializedOf<SavedIronmanRun>>();

  async save(run: SerializedOf<SavedIronmanRun>): Promise<void> {
    // clone to emulate the serialize/deserialize boundary of a real DB. Without this we would
    // store the live object graph (toSerialized leaks references like speccedAttributes), so the
    // stored "snapshot" would alias and reflect later mutations of the live game.
    this.runs.set(run._game.id, cloneDeep(run));
  }

  async fetchRunOption(runId: GameId): Promise<SerializedOf<SavedIronmanRun> | undefined> {
    const stored = this.runs.get(runId);
    return stored === undefined ? undefined : cloneDeep(stored);
  }

  async delete(runId: GameId): Promise<void> {
    this.runs.delete(runId);
  }
}
