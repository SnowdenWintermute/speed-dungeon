import { AdventuringParty } from "../../adventuring-party/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { EntityId } from "../../primatives/index.js";
import { ActionEntityTurnTracker } from "./index.js";
import { ITurnScheduler, TurnScheduler } from "./turn-schedulers.js";

export class ActionEntityTurnScheduler extends TurnScheduler implements ITurnScheduler {
  constructor(public readonly actionEntityId: EntityId) {
    super();
  }
  getTiebreakerId = () => this.actionEntityId;
  getSpeed(party: AdventuringParty) {
    const entityOption = party.actionEntities[this.actionEntityId];
    if (entityOption === undefined) throw new Error("no action entity found");
    const { actionEntityProperties } = entityOption;
    const { actionOriginData } = actionEntityProperties;
    if (actionOriginData === undefined)
      throw new Error("expected action entity to have origin data");

    return actionOriginData.turnOrderSpeed || 0;
  }
  isStale(party: AdventuringParty) {
    const actionEntity = AdventuringParty.getActionEntity(party, this.actionEntityId);
    return actionEntity instanceof Error;
  }
  isMatch(otherScheduler: ITurnScheduler): boolean {
    return (
      otherScheduler instanceof ActionEntityTurnScheduler &&
      otherScheduler.actionEntityId === this.actionEntityId
    );
  }
  createTurnTrackerOption(game: SpeedDungeonGame, party: AdventuringParty) {
    const { actionEntityId, timeOfNextMove } = this;
    const actionEntityResult = AdventuringParty.getActionEntity(party, actionEntityId);
    if (actionEntityResult instanceof Error) throw actionEntityResult;
    const actionEntity = actionEntityResult;

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
