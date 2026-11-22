import { AdventuringParty } from "../../../adventuring-party/index.js";
import { CombatantId } from "../../../aliases.js";
import { CombatantTurnScheduler } from "../turn-schedulers/combatant-turn-scheduler.js";
import { TaggedCombatantTurnTrackerCombatantId } from "../turn-tracker-tagged-tracked-entity-ids.js";
import { ITurnScheduler } from "../turn-schedulers/index.js";
import { SpeedDungeonGame } from "../../../game/index.js";
import { AISelectActionAndTarget } from "../../ai-behavior/ai-select-action-and-target.js";
import { RandomNumberGenerationPolicy } from "../../../utility-classes/random-number-generation-policy.js";
import { ActionUserType } from "../../../action-user-context/action-user.js";
import { ActionIntentOptionAndUser, ResourceChangePropertiesStrategy } from "../../../index.js";
import { TurnTracker } from "./index.js";

export class CombatantTurnTracker extends TurnTracker {
  constructor(
    private combatantId: CombatantId,
    timeOfNextMove: number,
    schedulerIndex: number
  ) {
    super(timeOfNextMove, schedulerIndex);
  }

  getTaggedIdOfTrackedEntity(): TaggedCombatantTurnTrackerCombatantId {
    return { type: ActionUserType.Combatant, combatantId: this.combatantId };
  }

  getMatchingScheduler(schedulers: ITurnScheduler[]): undefined | ITurnScheduler {
    return schedulers.find(
      (item) =>
        item instanceof CombatantTurnScheduler &&
        item.combatantId === this.combatantId &&
        item.index === this.schedulerIndex
    );
  }

  getNextActionIntentAndUser(
    game: SpeedDungeonGame,
    party: AdventuringParty,
    randomNumberGenerationPolicy: RandomNumberGenerationPolicy,
    resourceChangePropertiesStrategy: ResourceChangePropertiesStrategy
  ): ActionIntentOptionAndUser {
    const { combatantId } = this;
    const activeCombatant = party.combatantManager.getExpectedCombatant(combatantId);

    const actionExecutionIntent = AISelectActionAndTarget(
      game,
      activeCombatant,
      randomNumberGenerationPolicy,
      resourceChangePropertiesStrategy
    );
    if (actionExecutionIntent instanceof Error) throw actionExecutionIntent;

    return { actionExecutionIntent, user: activeCombatant };
  }
}
