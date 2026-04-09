import { v4 as uuidv4 } from "uuid";
import { EntityId } from "../aliases.js";

export abstract class IdGenerator {
  protected history = new Map<EntityId, string>();

  constructor(protected options: { saveHistory: boolean }) {}

  abstract generate(historyNote?: string): EntityId;

  getHistoryNote(id: EntityId) {
    return this.history.get(id);
  }
}

export class IdGeneratorRandom extends IdGenerator {
  generate(historyNote?: string): EntityId {
    const id = uuidv4();
    if (this.options.saveHistory) {
      this.history.set(id, historyNote || "");
    }
    return id;
  }
}

export class IdGeneratorSequential extends IdGenerator {
  private last = 0;

  generate(historyNote?: string): EntityId {
    const id = "eid-" + (++this.last).toString();
    if (this.options.saveHistory) {
      this.history.set(id, historyNote || "");
    }
    return id;
  }
}
