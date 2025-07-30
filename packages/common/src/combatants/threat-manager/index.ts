import { Matrix, Quaternion, Vector3 } from "@babylonjs/core";
import { AdventuringParty } from "../../adventuring-party/index.js";
import { EntityId, MaxAndCurrent } from "../../primatives/index.js";
import { Combatant } from "../index.js";

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
  private previouslyHighestThreatId: null | EntityId = null;
  constructor() {}

  changeThreat(combatantId: EntityId, threatType: ThreatType, value: number) {
    let existingEntry = this.threatScoresByCombatantId[combatantId];
    if (existingEntry === undefined)
      this.threatScoresByCombatantId[combatantId] = existingEntry = new ThreatTableEntry();
    existingEntry.threatScoresByType[threatType].addValue(value);
  }

  getPreviouslyHighestThreatId() {
    return this.previouslyHighestThreatId;
  }
  setPreviouslyHighestThreatId(id: EntityId) {
    this.previouslyHighestThreatId = id;
  }

  getHighestThreatCombatantId(): EntityId | null {
    const entries = Object.entries(this.threatScoresByCombatantId);
    if (entries.length === 0) return null;
    return entries.reduce((a, b) => (a[1].getTotal() > b[1].getTotal() ? a : b))[0];
  }

  getEntries() {
    return this.threatScoresByCombatantId;
  }

  /** Returns true if updated top target */
  updateHomeRotationToPointTowardNewTopThreatTarget(party: AdventuringParty, monster: Combatant) {
    const newThreatTargetIdOption = this.getHighestThreatCombatantId();
    if (newThreatTargetIdOption === this.getPreviouslyHighestThreatId()) return false;

    if (!newThreatTargetIdOption) return false;
    this.setPreviouslyHighestThreatId(newThreatTargetIdOption);

    const newTargetCombatant = AdventuringParty.getExpectedCombatant(
      party,
      newThreatTargetIdOption
    );
    const targetPos = newTargetCombatant.combatantProperties.homeLocation;
    const monsterPos = monster.combatantProperties.position;

    const lookAtMatrix = Matrix.LookAtLH(monsterPos, targetPos, Vector3.Up());
    // Invert because LookAtLH returns a view matrix
    const worldRotation = Quaternion.FromRotationMatrix(lookAtMatrix).invert();

    monster.combatantProperties.homeRotation = worldRotation;

    return true;
  }
}
