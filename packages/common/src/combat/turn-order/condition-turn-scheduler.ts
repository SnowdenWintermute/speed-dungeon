import { AdventuringParty } from "../../adventuring-party/index.js";
import { EntityId } from "../../primatives/index.js";
import { CombatantCondition } from "../../combatants/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { ITurnScheduler, TurnScheduler } from "./turn-schedulers.js";
import { ConditionTurnTracker } from "./turn-trackers.js";
import { ActionUserContext } from "../../action-user-context/index.js";
import { CombatantProperties } from "../../combatants/combatant-properties.js";

export class ConditionTurnScheduler extends TurnScheduler implements ITurnScheduler {
  constructor(
    public readonly combatantId: EntityId,
    public readonly conditionId: EntityId
  ) {
    super();
  }
  getTiebreakerId = () => this.conditionId;
  getSpeed(party: AdventuringParty) {
    const condition = party.combatantManager.getExpectedConditionOnCombatant(
      this.combatantId,
      this.conditionId
    );

    const tickPropertiesOption = CombatantCondition.getTickProperties(condition);

    if (tickPropertiesOption === null) throw new Error("expected condition to be tickable");
    return tickPropertiesOption.getTickSpeed(condition);
  }

  isStale(party: AdventuringParty) {
    const { combatantManager } = party;
    const combatantOption = combatantManager.getCombatantOption(this.combatantId);
    const combatantIsDeadOrMissing =
      combatantOption === undefined ||
      CombatantProperties.isDead(combatantOption.combatantProperties);
    if (combatantIsDeadOrMissing) return true;

    const conditionResult = combatantManager.getConditionOptionOnCombatant(
      this.combatantId,
      this.conditionId
    );
    return conditionResult === undefined;
  }

  isMatch(otherScheduler: ITurnScheduler): boolean {
    return (
      otherScheduler instanceof ConditionTurnScheduler &&
      otherScheduler.conditionId === this.conditionId
    );
  }

  createTurnTrackerOption(game: SpeedDungeonGame, party: AdventuringParty) {
    const { combatantId, conditionId, timeOfNextMove } = this;
    const { combatantManager } = party;
    const condition = combatantManager.getExpectedConditionOnCombatant(combatantId, conditionId);

    const stacksRemaining = condition.stacksOption?.current;

    if (!stacksRemaining) return null;

    // check how many previous trackers we've pushed for this condition and how many stacks they would consume
    // only push if we haven't maxed out yet
    // record expected stacks consumed for this condition on its turn

    if (this.predictedConsumedStacks < stacksRemaining) {
      const tickPropertiesOption = CombatantCondition.getTickProperties(condition);

      if (tickPropertiesOption) {
        const ticksPredicted = tickPropertiesOption.onTick(
          new ActionUserContext(game, party, condition)
        ).numStacksRemoved;

        this.predictedConsumedStacks += ticksPredicted;
        return new ConditionTurnTracker(combatantId, conditionId, timeOfNextMove);
      }
    }

    return null;
  }
}
