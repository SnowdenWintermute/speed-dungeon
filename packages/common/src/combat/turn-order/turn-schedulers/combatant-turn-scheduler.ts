import { AdventuringParty } from "../../../adventuring-party/index.js";
import { CombatantId } from "../../../aliases.js";
import { ITurnScheduler, TurnScheduler } from "./index.js";
import { SpeedDungeonGame } from "../../../game/index.js";
import { CombatantTurnTracker } from "../turn-trackers/combatant-turn-tracker.js";
import { ActionUserType } from "../../../action-user-context/tagged-action-user-id.js";
import { TaggedCombatantTurnTrackerCombatantId } from "../turn-tracker-tagged-tracked-entity-ids.js";

export class CombatantTurnScheduler extends TurnScheduler implements ITurnScheduler {
  actionUserType = ActionUserType.Combatant;
  getTaggedEntityId: () => TaggedCombatantTurnTrackerCombatantId = () => {
    return { type: ActionUserType.Combatant, combatantId: this.combatantId };
  };

  constructor(
    public readonly combatantId: CombatantId,
    index: number,
    initialDelay: number
  ) {
    super(index, initialDelay);
  }
  getTurnTakerId = () => this.combatantId;

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
    const combatant = party.combatantManager.requireCombatantById(this.combatantId);
    const isDead = combatant.combatantProperties.isDead();

    if (isDead) throw new Error("why is a combatant dead when trying to make its trackers");

    return new CombatantTurnTracker(this.combatantId, this.timeOfNextMove, this.index);
  }

  requireActionUser(party: AdventuringParty) {
    return party.combatantManager.requireCombatantById(this.combatantId);
  }
}
