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
} from "./turn-tracker-tagged-tracked-entity-ids.js";
import { ITurnScheduler } from "./turn-schedulers.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { Battle } from "../../battle/index.js";
import { AISelectActionAndTarget } from "../ai-behavior/ai-select-action-and-target.js";
import { ActionIntentOptionAndUser } from "../../action-processing/index.js";
import { CombatantCondition } from "../../combatants/index.js";
import { ACTION_ENTITY_ACTION_INTENT_GETTERS } from "../../action-entities/index.js";
import { ActionUserContext } from "../../action-user-context/index.js";

export abstract class TurnTracker {
  constructor(public readonly timeOfNextMove: number) {}

  abstract getTaggedIdOfTrackedEntity(): TaggedTurnTrackerTrackedEntityId;
  abstract getMatchingScheduler(schedulers: ITurnScheduler[]): undefined | ITurnScheduler;
  abstract getNextActionIntentAndUser(
    game: SpeedDungeonGame,
    party: AdventuringParty,
    battle: Battle
  ): ActionIntentOptionAndUser;

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

  getNextActionIntentAndUser(game: SpeedDungeonGame, party: AdventuringParty, battle: Battle) {
    const { combatantId } = this;
    const activeCombatant = party.combatantManager.getExpectedCombatant(combatantId);

    const actionExecutionIntent = AISelectActionAndTarget(game, activeCombatant);
    if (actionExecutionIntent instanceof Error) throw actionExecutionIntent;

    return { actionExecutionIntent, user: activeCombatant };
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
    return party.combatantManager.getExpectedConditionOnCombatant(
      this.combatantId,
      this.conditionId
    );
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

  getNextActionIntentAndUser(game: SpeedDungeonGame, party: AdventuringParty, battle: Battle) {
    const { combatantId, conditionId } = this;
    const condition = party.combatantManager.getExpectedConditionOnCombatant(
      combatantId,
      conditionId
    );

    const tickPropertiesOption = condition.getTickProperties();
    if (tickPropertiesOption === null)
      throw new Error("expected condition tick properties were missing");

    const onTick = tickPropertiesOption.onTick(new ActionUserContext(game, party, condition));

    const { actionExecutionIntent, user } = onTick.triggeredAction.actionIntentAndUser;
    return { actionExecutionIntent, user };
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
    const { actionEntityManager } = party;
    return actionEntityManager.getExpectedActionEntity(this.actionEntityId);
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

  getNextActionIntentAndUser(game: SpeedDungeonGame, party: AdventuringParty, battle: Battle) {
    const { actionEntityId } = this;

    const { actionEntityManager } = party;
    const actionEntityResult = actionEntityManager.getExpectedActionEntity(actionEntityId);

    const actionIntentGetterOption =
      ACTION_ENTITY_ACTION_INTENT_GETTERS[actionEntityResult.actionEntityProperties.name];

    if (actionIntentGetterOption === undefined)
      throw new Error(
        "expected an action entity with a turn tracker to have an actionIntentGetterOption"
      );

    const actionExecutionIntent = actionIntentGetterOption();

    return {
      actionExecutionIntent,
      user: actionEntityResult,
    };
  }
}
