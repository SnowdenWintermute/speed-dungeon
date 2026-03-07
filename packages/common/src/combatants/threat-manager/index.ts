import { Matrix, Quaternion, Vector3 } from "@babylonjs/core";
import { AdventuringParty } from "../../adventuring-party/index.js";
import { Combatant } from "../index.js";
import { makeAutoObservable } from "mobx";
import { EntityId } from "../../aliases.js";
import { ThreatTableEntry } from "./threat-table-entry.js";
import { ReactiveNode, Serializable, SerializedOf } from "../../serialization/index.js";
import { MapUtils } from "../../utils/map-utils.js";

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

export class ThreatManager implements Serializable, ReactiveNode {
  private threatScoresByCombatantId = new Map<EntityId, ThreatTableEntry>();
  private previouslyHighestThreatId: null | EntityId = null;
  private observable = false;

  makeObservable() {
    makeAutoObservable(this);
    this.threatScoresByCombatantId.forEach((entry) => entry.makeObservable());
    this.observable = true;
  }

  toSerialized() {
    return {
      threatScoresByCombatantId: MapUtils.serialize(this.threatScoresByCombatantId, (value) =>
        value.toSerialized()
      ),
      previouslyHighestThreatId: this.previouslyHighestThreatId,
    };
  }

  static fromSerialized(serialized: SerializedOf<ThreatManager>) {
    const result = new ThreatManager();
    result.threatScoresByCombatantId = MapUtils.deserialize(
      serialized.threatScoresByCombatantId,
      (v) => ThreatTableEntry.fromSerialized(v)
    );
    result.previouslyHighestThreatId = serialized.previouslyHighestThreatId;
    return result;
  }

  changeThreat(combatantId: EntityId, threatType: ThreatType, value: number) {
    let existingEntry = this.threatScoresByCombatantId.get(combatantId);
    // don't create a new entry if not generating threat
    if (existingEntry === undefined && value < 1) return;
    if (existingEntry === undefined) {
      const newEntry = new ThreatTableEntry();
      if (this.observable) {
        newEntry.makeObservable();
      }
      this.threatScoresByCombatantId.set(combatantId, newEntry);
      existingEntry = newEntry;
    }
    existingEntry.threatScoresByType[threatType].addValue(value);
  }

  getPreviouslyHighestThreatId() {
    return this.previouslyHighestThreatId;
  }
  setPreviouslyHighestThreatId(id: EntityId) {
    this.previouslyHighestThreatId = id;
  }

  getHighestThreatCombatantId(): EntityId | null {
    if (this.threatScoresByCombatantId.size === 0) return null;
    return [...this.threatScoresByCombatantId].reduce((a, b) =>
      a[1].getTotal() > b[1].getTotal() ? a : b
    )[0];
  }

  getEntries() {
    return this.threatScoresByCombatantId;
  }

  removeEntry(entityId: EntityId) {
    this.threatScoresByCombatantId.delete(entityId);
  }

  /** Returns true if updated top target */
  updateHomeRotationToPointTowardNewTopThreatTarget(party: AdventuringParty, monster: Combatant) {
    const newThreatTargetIdOption = this.getHighestThreatCombatantId();
    if (newThreatTargetIdOption === this.getPreviouslyHighestThreatId()) return false;

    if (!newThreatTargetIdOption) return false;
    this.setPreviouslyHighestThreatId(newThreatTargetIdOption);

    const newTargetCombatant = party.combatantManager.getExpectedCombatant(newThreatTargetIdOption);
    const targetPos = newTargetCombatant.getHomePosition().clone();

    // don't use their Y coordinate otherwise it will look strange when ground
    // units loot at flyers
    targetPos.y = 0;

    const monsterHomePos = monster.getHomePosition();

    const lookAtMatrix = Matrix.LookAtLH(monsterHomePos, targetPos, Vector3.Up());
    // Invert because LookAtLH returns a view matrix
    const worldRotation = Quaternion.FromRotationMatrix(lookAtMatrix).invert();

    monster.combatantProperties.transformProperties.homeRotation = worldRotation;

    return true;
  }
}
