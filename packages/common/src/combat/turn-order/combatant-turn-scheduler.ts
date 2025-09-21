import { AdventuringParty } from "../../adventuring-party/index.js";
import { EntityId } from "../../primatives/index.js";
import { CombatantProperties, CombatAttribute } from "../../combatants/index.js";
import { ITurnScheduler, TurnScheduler } from "./turn-schedulers.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { CombatantTurnTracker } from "./index.js";

export class CombatantTurnScheduler extends TurnScheduler implements ITurnScheduler {
  constructor(public readonly combatantId: EntityId) {
    super();
  }
  getTiebreakerId = () => this.combatantId;
  getSpeed(party: AdventuringParty) {
    const combatantResult = AdventuringParty.getCombatant(party, this.combatantId);
    if (combatantResult instanceof Error) throw combatantResult;
    const combatantSpeed = CombatantProperties.getTotalAttributes(
      combatantResult.combatantProperties
    )[CombatAttribute.Speed];
    return combatantSpeed;
  }

  isStale(party: AdventuringParty) {
    const combatantResult = AdventuringParty.getCombatant(party, this.combatantId);
    return (
      combatantResult instanceof Error ||
      CombatantProperties.isDead(combatantResult.combatantProperties)
    );
  }

  isMatch(otherScheduler: ITurnScheduler): boolean {
    return (
      otherScheduler instanceof CombatantTurnScheduler &&
      otherScheduler.combatantId === this.combatantId
    );
  }

  createTurnTrackerOption(game: SpeedDungeonGame, party: AdventuringParty) {
    const combatantResult = AdventuringParty.getCombatant(party, this.combatantId);
    if (combatantResult instanceof Error) throw combatantResult;
    const isDead = CombatantProperties.isDead(combatantResult.combatantProperties);
    if (isDead) throw new Error("why is a combatant dead when trying to make its trackers");

    return new CombatantTurnTracker(this.combatantId, this.timeOfNextMove);
    // numCombatantTrackersCreated += 1;
  }
}
