import { v4 as uuidv4 } from "uuid";
import { EntityId } from "../aliases.js";

export class IdGenerator {
  private history: Record<EntityId, string> = {};

  constructor(private options: { saveHistory: boolean }) {}

  generate(historyNote?: string): EntityId {
    const id = uuidv4();
    if (this.options.saveHistory) {
      this.history[id] = historyNote || "";
    }
    return id;
  }

  getHistoryNote(id: EntityId) {
    return this.history[id];
  }
}
