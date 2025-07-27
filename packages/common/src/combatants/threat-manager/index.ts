import { EntityId, MaxAndCurrent } from "../../primatives/index.js";

export const STABLE_THREAT_CAP = 10000;
export const VOLATILE_THREAT_CAP = 10000;

export enum ThreatType {
  Stable,
  Volatile,
}

export const THREAT_TYPE_STRINGS: Record<ThreatType, string> = {
  [ThreatType.Stable]: "Stable",
  [ThreatType.Volatile]: "Volatile",
};

export class ThreatTableEntry {
  public threatScoresByType: Record<ThreatType, MaxAndCurrent> = {
    [ThreatType.Stable]: new MaxAndCurrent(STABLE_THREAT_CAP, 0),
    [ThreatType.Volatile]: new MaxAndCurrent(VOLATILE_THREAT_CAP, 0),
  };
  constructor() {}

  getTotal() {
    return (
      this.threatScoresByType[ThreatType.Stable].current +
      this.threatScoresByType[ThreatType.Volatile].current
    );
  }
}

export class ThreatManager {
  private threatScoresByCombatantId: Record<EntityId, ThreatTableEntry> = {};
  constructor() {}

  changeThreat(combatantId: EntityId, threatType: ThreatType, value: number) {
    let existingEntry = this.threatScoresByCombatantId[combatantId];
    if (existingEntry === undefined)
      this.threatScoresByCombatantId[combatantId] = existingEntry = new ThreatTableEntry();
    existingEntry.threatScoresByType[threatType].addValue(value);
  }

  getHighestThreatCombatantId(): EntityId | null {
    const entries = Object.entries(this.threatScoresByCombatantId);
    if (entries.length === 0) return null;
    return entries.reduce((a, b) => (a[1].getTotal() > b[1].getTotal() ? a : b))[0];
  }

  getEntries() {
    return this.threatScoresByCombatantId;
  }
}
