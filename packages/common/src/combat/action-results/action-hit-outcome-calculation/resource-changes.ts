import { AdventuringParty } from "../../../adventuring-party/index.js";
import { CombatantContext } from "../../../combatant-context/index.js";
import { CombatantProperties } from "../../../combatants/index.js";
import { SpeedDungeonGame } from "../../../game/index.js";
import { EntityId } from "../../../primatives/index.js";
import { ResourceChange } from "../../hp-change-source-types.js";

export abstract class ResourceChanges<T> {
  protected changes: Record<EntityId, T> = {};
  constructor() {}
  addRecord(entityId: string, change: T) {
    this.changes[entityId] = change;
  }

  getRecord(entityId: EntityId) {
    return this.changes[entityId];
  }
  getRecords() {
    return Object.entries(this.changes);
  }

  abstract applyToGame(combatantContext: CombatantContext): void;
}

export class HitPointChanges extends ResourceChanges<ResourceChange> {
  constructor() {
    super();
  }
  applyToGame(combatantContext: CombatantContext) {
    const { game, party } = combatantContext;

    for (const [targetId, hpChange] of Object.entries(this.changes)) {
      const targetResult = AdventuringParty.getCombatant(party, targetId);
      if (targetResult instanceof Error) throw targetResult;
      const { combatantProperties: targetCombatantProperties } = targetResult;
      const combatantWasAliveBeforeResourceChange =
        !CombatantProperties.isDead(targetCombatantProperties);
      CombatantProperties.changeHitPoints(targetCombatantProperties, hpChange.value);

      const wasResurrected =
        !combatantWasAliveBeforeResourceChange &&
        !CombatantProperties.isDead(targetCombatantProperties);
      if (wasResurrected) {
        // - @todo - handle any ressurection by adding the affected combatant's turn tracker back into the battle
        // - well actually in the new system we just need to make sure their turnSchedulerTracker gets updated
        // with all the delay from the turns they would have taken if they had been alive the whole time
        // or else they will get many turns in a a row
      }
    }
  }
}

export class ManaChange {
  constructor(
    public value: number,
    public isCrit?: boolean
  ) {}
}

export class ManaChanges extends ResourceChanges<ManaChange> {
  constructor() {
    super();
  }

  applyToGame(combatantContext: CombatantContext) {
    const { party } = combatantContext;

    for (const [targetId, change] of Object.entries(this.changes)) {
      const targetResult = AdventuringParty.getCombatant(party, targetId);
      if (targetResult instanceof Error) throw targetResult;
      const { combatantProperties: targetCombatantProperties } = targetResult;
      CombatantProperties.changeMana(targetCombatantProperties, change.value);
    }
  }
}
