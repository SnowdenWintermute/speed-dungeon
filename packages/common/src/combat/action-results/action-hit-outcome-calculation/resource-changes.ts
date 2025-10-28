import { immerable } from "immer";
import { AdventuringParty } from "../../../adventuring-party/index.js";
import { ThreatType } from "../../../combatants/index.js";
import { EntityId } from "../../../primatives/index.js";
import { iterateNumericEnumKeyedRecord } from "../../../utils/index.js";
import { ResourceChange, ResourceChangeSource } from "../../hp-change-source-types.js";

export abstract class ResourceChanges<T> {
  protected changes: Record<EntityId, T> = {};
  constructor() {}
  addRecord(entityId: string, change: T) {
    this.changes[entityId] = change;
  }

  getRecord(entityId: EntityId) {
    return this.changes[entityId];
  }
  getRecords(): [EntityId, T][] {
    return Object.entries(this.changes);
  }

  abstract applyToGame(party: AdventuringParty): void;
}

export class HitPointChanges extends ResourceChanges<ResourceChange> {
  constructor() {
    super();
  }
  applyToGame(party: AdventuringParty) {
    const combatantsKilled: EntityId[] = [];

    for (const [targetId, hpChange] of Object.entries(this.changes)) {
      const target = party.combatantManager.getExpectedCombatant(targetId);
      const { combatantProperties: targetCombatantProperties } = target;
      const combatantWasAliveBeforeResourceChange = !targetCombatantProperties.isDead();

      targetCombatantProperties.resources.changeHitPoints(hpChange.value);

      const combatantIsDead = targetCombatantProperties.isDead();

      const wasResurrected = !combatantWasAliveBeforeResourceChange && !combatantIsDead;

      const wasKilled = combatantWasAliveBeforeResourceChange && combatantIsDead;
      if (wasKilled) combatantsKilled.push(targetId);

      if (wasResurrected) {
        // - @todo - handle any ressurection by adding the affected combatant's turn tracker back into the battle
        // - well actually in the new system we just need to make sure their turnSchedulerTracker gets updated
        // with all the delay from the turns they would have taken if they had been alive the whole time
        // or else they will get many turns in a a row
      }
    }

    return combatantsKilled;
  }
}

export class ManaChange {
  constructor(
    public value: number,
    public source: ResourceChangeSource,
    public isCrit?: boolean
  ) {}
}

export class ManaChanges extends ResourceChanges<ManaChange> {
  constructor() {
    super();
  }

  applyToGame(party: AdventuringParty) {
    for (const [targetId, change] of Object.entries(this.changes)) {
      const target = party.combatantManager.getExpectedCombatant(targetId);
      const { combatantProperties: targetCombatantProperties } = target;
      targetCombatantProperties.resources.changeMana(change.value);
    }
  }
}

export class ThreatChanges {
  [immerable] = true;
  private entries: {
    [entityIdOfThreatTableToUpdate: EntityId]: {
      [threatTableEntityId: EntityId]: Partial<Record<ThreatType, number>>;
    };
  } = {};
  private entriesToRemove: {
    [entityIdOfThreatTableToUpdate: EntityId]: EntityId[];
  } = {};
  constructor() {}
  isEmpty() {
    return Object.keys(this.entries).length === 0;
  }
  addEntryToRemove(entityIdOfThreatTableToUpdate: EntityId, threatTableEntityId: EntityId) {
    let existing = this.entriesToRemove[entityIdOfThreatTableToUpdate];
    if (existing === undefined) existing = this.entriesToRemove[entityIdOfThreatTableToUpdate] = [];
    if (existing.includes(threatTableEntityId)) return;
    existing.push(threatTableEntityId);
  }
  getEntriesToRemove() {
    return this.entriesToRemove;
  }
  addOrUpdateEntry(
    monsterIdOwnerOfThreatTable: EntityId,
    entityIdOfEntryInTable: EntityId,
    threatType: ThreatType,
    value: number
  ) {
    let existingEntry = this.entries[monsterIdOwnerOfThreatTable];
    if (existingEntry === undefined)
      existingEntry = this.entries[monsterIdOwnerOfThreatTable] = {
        [entityIdOfEntryInTable]: {},
      };

    let existingEntityThreat = existingEntry[entityIdOfEntryInTable];
    if (existingEntityThreat === undefined)
      existingEntityThreat = existingEntry[entityIdOfEntryInTable] = {};
    if (existingEntityThreat[threatType] === undefined) existingEntityThreat[threatType] = value;
    else existingEntityThreat[threatType] += value;

    return existingEntityThreat[threatType];
  }

  applyToGame(party: AdventuringParty): void {
    for (const [entityIdOfThreatTableToUpdate, changes] of Object.entries(this.entries)) {
      const targetCombatant = party.combatantManager.getExpectedCombatant(
        entityIdOfThreatTableToUpdate
      );

      const { combatantProperties: targetCombatantProperties } = targetCombatant;

      const { threatManager } = targetCombatantProperties;
      if (!threatManager) throw new Error("got threat changes on an entity with no threat manager");

      for (const [entityId, changesByThreatType] of Object.entries(changes))
        for (const [threatType, value] of iterateNumericEnumKeyedRecord(changesByThreatType))
          threatManager.changeThreat(entityId, threatType, value);
    }

    for (const [entityIdOfThreatTableToUpdate, entityIdsToRemove] of Object.entries(
      this.entriesToRemove
    )) {
      const targetCombatant = party.combatantManager.getExpectedCombatant(
        entityIdOfThreatTableToUpdate
      );
      const { combatantProperties: targetCombatantProperties } = targetCombatant;

      const { threatManager } = targetCombatantProperties;
      if (!threatManager) throw new Error("got threat changes on an entity with no threat manager");
      for (const entityIdToRemove of entityIdsToRemove) {
        threatManager.removeEntry(entityIdToRemove);
      }
    }
  }
}
