import { Battle } from "../../battle/index.js";
import { CombatAttribute } from "../../combatants/attributes/index.js";
import { Combatant, CombatantCondition, CombatantProperties } from "../../combatants/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { EntityId } from "../../primatives/index.js";
import { BASE_ACTION_DELAY_MULTIPLIER } from "./consts.js";
import { CombatantTurnTracker, ConditionTurnTracker, TurnOrderManager } from "./index.js";

export class TurnOrderScheduler {
  constructor(public readonly minTrackersCount: number) {}

  buildNewList(game: SpeedDungeonGame, battle: Battle) {
    const { combatants, tickableConditions } = Battle.getAllTickableConditionsAndCombatants(
      game,
      battle
    );
    const turnSchedulerList: (
      | CombatantTurnSchedulerTracker
      | TickableConditionTurnSchedulerTracker
    )[] = [
      ...combatants.map((combatant) => new CombatantTurnSchedulerTracker(combatant)),
      ...tickableConditions.map(
        ({ combatantId, condition }) =>
          new TickableConditionTurnSchedulerTracker(combatantId, condition)
      ),
    ];

    const turnTrackerList: (CombatantTurnTracker | ConditionTurnTracker)[] = [];

    while (turnTrackerList.length < this.minTrackersCount) {
      turnSchedulerList.sort((a, b) => a.timeOfNextMove - b.timeOfNextMove);
      const fastestActor = turnSchedulerList[0];
      if (fastestActor === undefined) throw new Error("turn scheduler list was empty");
      if (fastestActor instanceof CombatantTurnSchedulerTracker)
        turnTrackerList.push(
          new CombatantTurnTracker(
            fastestActor.combatant.entityProperties.id,
            fastestActor.timeOfNextMove
          )
        );

      const delay = TurnOrderManager.getActionDelayCost(
        fastestActor.speed,
        BASE_ACTION_DELAY_MULTIPLIER
      );

      fastestActor.timeOfNextMove += delay;
    }

    return turnTrackerList;
  }
}

class TurnSchedulerTracker {
  timeOfNextMove: number = 0;
  constructor(public readonly speed: number) {
    this.timeOfNextMove = TurnOrderManager.getActionDelayCost(speed, BASE_ACTION_DELAY_MULTIPLIER);
  }
}

class CombatantTurnSchedulerTracker extends TurnSchedulerTracker {
  constructor(public readonly combatant: Combatant) {
    const combatantSpeed = CombatantProperties.getTotalAttributes(combatant.combatantProperties)[
      CombatAttribute.Speed
    ];
    super(combatantSpeed);
  }
}

class TickableConditionTurnSchedulerTracker extends TurnSchedulerTracker {
  constructor(
    public readonly combatantId: EntityId,
    public readonly condition: CombatantCondition
  ) {
    if (condition.tickProperties === undefined)
      throw new Error("expected condition to be tickable");
    const speed = condition.tickProperties.getTickSpeed();
    super(speed);
  }
}
