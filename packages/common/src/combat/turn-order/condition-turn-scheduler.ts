import { AdventuringParty } from "../../adventuring-party/index.js";
import { EntityId } from "../../primatives/index.js";
import { CombatantCondition, CombatantProperties } from "../../combatants/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { CombatantContext } from "../../combatant-context/index.js";
import { ITurnScheduler, TurnScheduler } from "./turn-schedulers.js";
import { ConditionTurnTracker } from "./turn-trackers.js";

export class ConditionTurnScheduler extends TurnScheduler implements ITurnScheduler {
  constructor(
    public readonly combatantId: EntityId,
    public readonly conditionId: EntityId
  ) {
    super();
  }
  getTiebreakerId = () => this.conditionId;
  getSpeed(party: AdventuringParty) {
    const conditionResult = AdventuringParty.getConditionOnCombatant(
      party,
      this.combatantId,
      this.conditionId
    );
    if (conditionResult instanceof Error) {
      throw conditionResult;
    }

    const tickPropertiesOption = CombatantCondition.getTickProperties(conditionResult);

    if (tickPropertiesOption === undefined) throw new Error("expected condition to be tickable");
    return tickPropertiesOption.getTickSpeed(conditionResult);
  }

  isStale(party: AdventuringParty) {
    const combatantResult = AdventuringParty.getCombatant(party, this.combatantId);
    const combatantIsDeadOrMissing =
      combatantResult instanceof Error ||
      CombatantProperties.isDead(combatantResult.combatantProperties);
    if (combatantIsDeadOrMissing) return true;

    const conditionResult = AdventuringParty.getConditionOnCombatant(
      party,
      this.combatantId,
      this.conditionId
    );
    return conditionResult instanceof Error;
  }

  isMatch(otherScheduler: ITurnScheduler): boolean {
    return (
      otherScheduler instanceof ConditionTurnScheduler &&
      otherScheduler.conditionId === this.conditionId
    );
  }

  createTurnTrackerOption(game: SpeedDungeonGame, party: AdventuringParty) {
    const { combatantId, conditionId, timeOfNextMove } = this;
    const conditionResult = AdventuringParty.getConditionOnCombatant(
      party,
      combatantId,
      conditionId
    );
    if (conditionResult instanceof Error) throw conditionResult;
    const condition = conditionResult;
    const stacksRemaining = condition.stacksOption?.current;

    if (!stacksRemaining) return null;

    // check how many previous trackers we've pushed for this condition and how many stacks they would consume
    // only push if we haven't maxed out yet
    // record expected stacks consumed for this condition on its turn

    if (this.predictedConsumedStacks < stacksRemaining) {
      const tickPropertiesOption = CombatantCondition.getTickProperties(condition);
      if (tickPropertiesOption) {
        const combatantAppliedToResult = AdventuringParty.getCombatant(party, combatantId);
        if (combatantAppliedToResult instanceof Error) throw combatantAppliedToResult;

        const ticksPredicted = tickPropertiesOption.onTick(
          condition,
          new CombatantContext(game, party, combatantAppliedToResult)
        ).numStacksRemoved;

        this.predictedConsumedStacks += ticksPredicted;
        return new ConditionTurnTracker(combatantId, conditionId, timeOfNextMove);
      }
    }

    return null;
  }
}
