import { AdventuringParty } from "../../../adventuring-party/index.js";
import { EntityId } from "../../../aliases.js";
import { ConditionTurnScheduler } from "../turn-schedulers/condition-turn-scheduler.js";
import { TaggedConditionTurnTrackerConditionAndCombatantId } from "../turn-tracker-tagged-tracked-entity-ids.js";
import { ITurnScheduler } from "../turn-schedulers/index.js";
import { SpeedDungeonGame } from "../../../game/index.js";
import { ActionUserContext } from "../../../action-user-context/index.js";
import { RandomNumberGenerationPolicy } from "../../../utility-classes/random-number-generation-policy.js";
import { ActionUserType } from "../../../action-user-context/action-user.js";
import { TurnTracker } from "./index.js";

export class ConditionTurnTracker extends TurnTracker {
  constructor(
    private combatantId: EntityId,
    private conditionId: EntityId,
    public readonly timeOfNextMove: number,
    schedulerIndex: number
  ) {
    super(timeOfNextMove, schedulerIndex);
  }

  getTaggedIdOfTrackedEntity(): TaggedConditionTurnTrackerConditionAndCombatantId {
    return {
      type: ActionUserType.Condition,
      combatantId: this.combatantId,
      conditionId: this.conditionId,
    };
  }

  getCondition(party: AdventuringParty) {
    return party.combatantManager.requireConditionOnCombatant(this.combatantId, this.conditionId);
  }

  getId() {
    return this.timeOfNextMove + this.conditionId;
  }

  getMatchingScheduler(schedulers: ITurnScheduler[]) {
    return schedulers.find(
      (item) =>
        item instanceof ConditionTurnScheduler &&
        item.conditionId === this.conditionId &&
        item.index === this.schedulerIndex
    );
  }

  getNextActionIntentAndUser(
    game: SpeedDungeonGame,
    party: AdventuringParty,
    randomNumberGenerationPolicy: RandomNumberGenerationPolicy
  ) {
    const { combatantId, conditionId } = this;
    const condition = party.combatantManager.requireConditionOnCombatant(combatantId, conditionId);

    const tickPropertiesOption = condition.getTickProperties();
    if (!tickPropertiesOption) {
      throw new Error("expected condition tick properties were missing");
    }

    const onTick = tickPropertiesOption.onTick(new ActionUserContext(game, party, condition));

    const { actionExecutionIntent, user } = onTick.triggeredAction.actionIntentAndUser;
    return { actionExecutionIntent, user };
  }
}
