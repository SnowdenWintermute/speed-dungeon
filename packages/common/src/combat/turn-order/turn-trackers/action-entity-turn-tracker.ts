import { AdventuringParty } from "../../../adventuring-party/index.js";
import { EntityId } from "../../../aliases.js";
import { ActionEntityTurnScheduler } from "../turn-schedulers/action-entity-turn-scheduler.js";
import { TaggedActionEntityTurnTrackerActionEntityId } from "../turn-tracker-tagged-tracked-entity-ids.js";
import { ITurnScheduler } from "../turn-schedulers/index.js";
import { SpeedDungeonGame } from "../../../game/index.js";
import { ACTION_ENTITY_ACTION_INTENT_GETTERS } from "../../../action-entities/index.js";
import { RandomNumberGenerationPolicy } from "../../../utility-classes/random-number-generation-policy.js";
import { ActionUserType } from "../../../action-user-context/action-user.js";
import { TurnTracker } from "./index.js";
import { ActionIntentOptionAndUser } from "../../../action-processing/action-steps/index.js";

export class ActionEntityTurnTracker extends TurnTracker {
  constructor(
    private actionEntityId: EntityId,
    public readonly timeOfNextMove: number,
    schedulerIndex: number
  ) {
    super(timeOfNextMove, schedulerIndex);
  }

  getActionEntity(party: AdventuringParty) {
    const { actionEntityManager } = party;
    return actionEntityManager.getExpectedActionEntity(this.actionEntityId);
  }

  getTaggedIdOfTrackedEntity(): TaggedActionEntityTurnTrackerActionEntityId {
    return {
      type: ActionUserType.ActionEntity,
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
        item instanceof ActionEntityTurnScheduler &&
        item.actionEntityId === this.actionEntityId &&
        item.index === this.schedulerIndex
    );
  }

  getNextActionIntentAndUser(
    game: SpeedDungeonGame,
    party: AdventuringParty,
    randomNumberGenerationPolicy: RandomNumberGenerationPolicy
  ): ActionIntentOptionAndUser {
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
