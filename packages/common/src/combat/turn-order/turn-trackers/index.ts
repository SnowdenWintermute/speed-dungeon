import { AdventuringParty } from "../../../adventuring-party/index.js";
import { TaggedTurnTrackerTrackedEntityId } from "../turn-tracker-tagged-tracked-entity-ids.js";
import { ITurnScheduler } from "../turn-schedulers/index.js";
import { SpeedDungeonGame } from "../../../game/index.js";
import { ActionIntentOptionAndUser } from "../../../action-processing/action-steps/index.js";
import { RandomNumberGenerationPolicy } from "../../../utility-classes/random-number-generation-policy.js";
import { ActionUserType } from "../../../action-user-context/action-user.js";
import { ResourceChangePropertiesStrategy } from "../../../index.js";

export abstract class TurnTracker {
  constructor(
    public readonly timeOfNextMove: number,
    public readonly schedulerIndex: number
  ) {}

  abstract getTaggedIdOfTrackedEntity(): TaggedTurnTrackerTrackedEntityId;
  abstract getMatchingScheduler(schedulers: ITurnScheduler[]): undefined | ITurnScheduler;

  abstract getNextActionIntentAndUser(
    game: SpeedDungeonGame,
    party: AdventuringParty,
    randomNumberGenerationPolicy: RandomNumberGenerationPolicy,
    resourceChangePropertiesStrategy: ResourceChangePropertiesStrategy
  ): ActionIntentOptionAndUser;

  getEntityId() {
    const taggedId = this.getTaggedIdOfTrackedEntity();
    switch (taggedId.type) {
      case ActionUserType.Combatant:
        return taggedId.combatantId;
      case ActionUserType.Condition:
        return taggedId.conditionId;
      case ActionUserType.ActionEntity:
        return taggedId.actionEntityId;
    }
  }

  getId() {
    const id =
      this.timeOfNextMove.toFixed(3) +
      "--" +
      JSON.stringify(this.getTaggedIdOfTrackedEntity()) +
      this.schedulerIndex;
    return id;
  }
}
