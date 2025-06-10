import { AdventuringParty } from "../../adventuring-party/index.js";
import { CombatantProperties } from "../../combatants/index.js";
import { EntityId } from "../../primatives/index.js";

export * from "./tick-combat-until-next-combatant-is-active.js";

export class CombatantTurnTracker {
  movement: number = 0;
  constructor(
    public readonly entityId: string,
    public readonly tieBreakerId: number
  ) {}

  getCombatant(party: AdventuringParty) {
    return AdventuringParty.getCombatant(party, this.entityId);
  }
}

export class ConditionTurnTracker extends CombatantTurnTracker {
  constructor(
    combatantId: EntityId,
    public readonly conditionId: EntityId,
    tieBreakerId: number
  ) {
    super(combatantId, tieBreakerId);
  }

  getCondition(party: AdventuringParty) {
    const combatantResult = this.getCombatant(party);
    if (combatantResult instanceof Error) throw combatantResult;
    const conditionOption = CombatantProperties.getConditionById(
      combatantResult.combatantProperties,
      this.conditionId
    );
    if (conditionOption === null) throw new Error("expected condition not found");
    return conditionOption;
  }

  getSpeed(): number {
    return 0;
  }
}
