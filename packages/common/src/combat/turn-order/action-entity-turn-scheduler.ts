import { AdventuringParty } from "../../adventuring-party/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { EntityId } from "../../primatives/index.js";
import { ITurnScheduler, TurnScheduler } from "./turn-schedulers.js";
import { ActionEntityTurnTracker } from "./turn-trackers.js";

export class ActionEntityTurnScheduler extends TurnScheduler implements ITurnScheduler {
  constructor(public readonly actionEntityId: EntityId) {
    super();
  }
  getTiebreakerId = () => this.actionEntityId;

  getSpeed(party: AdventuringParty) {
    const { actionEntityManager } = party;
    const entityOption = actionEntityManager.getExpectedActionEntity(this.actionEntityId);
    const { actionEntityProperties } = entityOption;
    const { actionOriginData } = actionEntityProperties;
    if (actionOriginData === undefined)
      throw new Error("expected action entity to have origin data");

    return actionOriginData.turnOrderSpeed || 0;
  }

  isStale(party: AdventuringParty) {
    const { actionEntityManager } = party;
    const entityOption = actionEntityManager.getActionEntityOption(this.actionEntityId);
    return entityOption === undefined;
  }

  isMatch(otherScheduler: ITurnScheduler): boolean {
    return (
      otherScheduler instanceof ActionEntityTurnScheduler &&
      otherScheduler.actionEntityId === this.actionEntityId
    );
  }

  createTurnTrackerOption(game: SpeedDungeonGame, party: AdventuringParty) {
    const { actionEntityId, timeOfNextMove } = this;

    const { actionEntityManager } = party;
    const actionEntity = actionEntityManager.getExpectedActionEntity(this.actionEntityId);

    const { actionOriginData } = actionEntity.actionEntityProperties;
    if (actionOriginData === undefined)
      throw new Error("expected actionOriginData for an action entity with a turn scheduler");
    if (actionOriginData.stacks === undefined) throw new Error("expected action entity stacks");

    const turnsRemaining = actionOriginData.stacks.current || 0;

    if (!turnsRemaining) return null;
    // see how it's done for conditions, similar reasoning about how to not show trackers for turns that
    // won't happen since they'll have run out of turns

    if (this.predictedConsumedStacks >= turnsRemaining) return null;

    const numberOfTurnsConsumed = 1;
    this.predictedConsumedStacks += numberOfTurnsConsumed;

    return new ActionEntityTurnTracker(actionEntityId, timeOfNextMove);
  }
}
