import { EntityId, MaxAndCurrent } from "../../primatives/index.js";

export enum ThreatType {
  Stable,
  Volatile,
}

export class ThreatTableEntry {
  public entries: Record<ThreatType, MaxAndCurrent> = {
    [ThreatType.Stable]: new MaxAndCurrent(100, 0),
    [ThreatType.Volatile]: new MaxAndCurrent(100, 0),
  };
  constructor() {}

  getTotal() {
    return this.entries[ThreatType.Stable].current + this.entries[ThreatType.Volatile].current;
  }
}

export class ThreatManager {
  private threatScoresByCombatantId: Record<EntityId, ThreatTableEntry> = {};
  constructor() {}

  changeThreat(combatantId: EntityId, threatType: ThreatType, value: number) {
    let existingEntry = this.threatScoresByCombatantId[combatantId];
    if (existingEntry === undefined)
      this.threatScoresByCombatantId[combatantId] = existingEntry = new ThreatTableEntry();
    existingEntry.entries[threatType].addValue(value);
  }

  getHighestThreatCombatantId(): EntityId | null {
    const entries = Object.entries(this.threatScoresByCombatantId);
    if (entries.length === 0) return null;
    return entries.reduce((a, b) => (a[1] > b[1] ? a : b))[0];
  }

  getEntries() {
    return this.threatScoresByCombatantId;
  }
}
