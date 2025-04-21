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
    console.log("before record add:", this.changes);
    this.changes[entityId] = change;
    console.log("after record: ", this.changes);
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
      const combatantWasAliveBeforeResourceChange = targetCombatantProperties.hitPoints > 0;
      CombatantProperties.changeHitPoints(targetCombatantProperties, hpChange.value);

      if (targetCombatantProperties.hitPoints <= 0) {
        SpeedDungeonGame.handleCombatantDeath(game, party.battleId, targetId);
      }

      // - @todo - handle any ressurection by adding the affected combatant's turn tracker back into the battle
      if (!combatantWasAliveBeforeResourceChange && targetCombatantProperties.hitPoints > 0) {
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
