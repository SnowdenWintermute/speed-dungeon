import { AdventuringParty } from "../../adventuring-party/index.js";
import { EntityId } from "../../primatives/index.js";
import { ActionEntityTurnScheduler } from "./action-entity-turn-scheduler.js";
import { CombatantTurnScheduler } from "./combatant-turn-scheduler.js";
import { ConditionTurnScheduler } from "./condition-turn-scheduler.js";
import {
  TaggedActionEntityTurnTrackerActionEntityId,
  TaggedCombatantTurnTrackerCombatantId,
  TaggedConditionTurnTrackerConditionAndCombatantId,
  TaggedTurnTrackerTrackedEntityId,
  TurnTrackerEntityType,
} from "./turn-tracker-factory.js";
import { ITurnScheduler } from "./turn-schedulers.js";

export abstract class TurnTracker {
  constructor(public readonly timeOfNextMove: number) {}

  abstract getTaggedIdOfTrackedEntity(): TaggedTurnTrackerTrackedEntityId;
  abstract getMatchingScheduler(schedulers: ITurnScheduler[]): undefined | ITurnScheduler;

  getId() {
    const id =
      this.timeOfNextMove.toFixed(3) + "--" + JSON.stringify(this.getTaggedIdOfTrackedEntity());
    return id;
  }
}

export class CombatantTurnTracker extends TurnTracker {
  constructor(
    private combatantId: string,
    timeOfNextMove: number
  ) {
    super(timeOfNextMove);
  }

  getTaggedIdOfTrackedEntity(): TaggedCombatantTurnTrackerCombatantId {
    return { type: TurnTrackerEntityType.Combatant, combatantId: this.combatantId };
  }

  getMatchingScheduler(schedulers: ITurnScheduler[]) {
    return schedulers.find(
      (item) => item instanceof CombatantTurnScheduler && item.combatantId === this.combatantId
    );
  }
}

export class ConditionTurnTracker extends TurnTracker {
  constructor(
    private combatantId: EntityId,
    private conditionId: EntityId,
    public readonly timeOfNextMove: number
  ) {
    super(timeOfNextMove);
  }

  getTaggedIdOfTrackedEntity(): TaggedConditionTurnTrackerConditionAndCombatantId {
    return {
      type: TurnTrackerEntityType.Condition,
      combatantId: this.combatantId,
      conditionId: this.conditionId,
    };
  }

  getCondition(party: AdventuringParty) {
    const result = AdventuringParty.getConditionOnCombatant(
      party,
      this.combatantId,
      this.conditionId
    );
    if (result instanceof Error) throw result;
    return result;
  }

  getSpeed(): number {
    return 0;
  }

  getId() {
    return this.timeOfNextMove + this.conditionId;
  }

  getMatchingScheduler(schedulers: ITurnScheduler[]) {
    return schedulers.find(
      (item) => item instanceof ConditionTurnScheduler && item.conditionId === this.conditionId
    );
  }
}

export class ActionEntityTurnTracker extends TurnTracker {
  constructor(
    private actionEntityId: EntityId,
    public readonly timeOfNextMove: number
  ) {
    super(timeOfNextMove);
  }

  getActionEntity(party: AdventuringParty) {
    const result = party.actionEntities[this.actionEntityId];
    if (result === undefined) throw new Error("no action entity by that id was registered");
    return result;
  }

  getTaggedIdOfTrackedEntity(): TaggedActionEntityTurnTrackerActionEntityId {
    return {
      type: TurnTrackerEntityType.ActionEntity,
      actionEntityId: this.actionEntityId,
    };
  }

  getSpeed(): number {
    return 0;
  }

  getId() {
    return this.timeOfNextMove + this.actionEntityId;
  }

  getMatchingScheduler(schedulers: ITurnScheduler[]) {
    return schedulers.find(
      (item) =>
        item instanceof ActionEntityTurnScheduler && item.actionEntityId === this.actionEntityId
    );
  }
}
