import { AdventuringParty } from "../../adventuring-party/index.js";
import { EntityId } from "../../primatives/index.js";
import { CombatAttribute } from "../../combatants/index.js";
import { ITurnScheduler, TurnScheduler } from "./turn-schedulers.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { CombatantTurnTracker } from "./turn-trackers.js";

export class CombatantTurnScheduler extends TurnScheduler implements ITurnScheduler {
  constructor(public readonly combatantId: EntityId) {
    super();
  }
  getTiebreakerId = () => this.combatantId;
  getSpeed(party: AdventuringParty) {
    const combatant = party.combatantManager.getExpectedCombatant(this.combatantId);
    const combatantSpeed = combatant.combatantProperties.attributeProperties.getAttributeValue(
      CombatAttribute.Speed
    );
    return combatantSpeed;
  }

  isStale(party: AdventuringParty) {
    const combatantOption = party.combatantManager.getCombatantOption(this.combatantId);
    const combatantMissing = combatantOption === undefined;
    return combatantMissing || combatantOption.combatantProperties.isDead();
  }

  isMatch(otherScheduler: ITurnScheduler): boolean {
    return (
      otherScheduler instanceof CombatantTurnScheduler &&
      otherScheduler.combatantId === this.combatantId
    );
  }

  createTurnTrackerOption(game: SpeedDungeonGame, party: AdventuringParty) {
    const combatant = party.combatantManager.getExpectedCombatant(this.combatantId);
    const isDead = combatant.combatantProperties.isDead();

    if (isDead) throw new Error("why is a combatant dead when trying to make its trackers");

    return new CombatantTurnTracker(this.combatantId, this.timeOfNextMove);
  }
}
