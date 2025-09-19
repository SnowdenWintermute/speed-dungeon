import { Combatant } from "../../../combatants/index.js";
import { EntityId } from "../../../primatives/index.js";
import { AIBehaviorContext } from "../ai-context.js";
import { BehaviorNode, BehaviorNodeState } from "../behavior-tree.js";
import { TargetCategories } from "../../combat-actions/targeting-schemes-and-categories.js";
import { AdventuringParty } from "../../../adventuring-party/index.js";

export class CollectConsideredCombatants implements BehaviorNode {
  constructor(
    private behaviorContext: AIBehaviorContext,
    private combatant: Combatant,
    private combatantRelation: TargetCategories,
    private filteringFunction: (combatant: Combatant) => boolean,
    private consideredCombatantsSetter: (combatants: Combatant[]) => void
  ) {}
  execute(): BehaviorNodeState {
    const combatantsToConsider: Combatant[] = [];

    const { allyIds, opponentIds } = this.behaviorContext.combatantContext.getAllyAndOpponentIds();
    const idsToFetchCombatants: EntityId[] = [];
    switch (this.combatantRelation) {
      case TargetCategories.Any:
        idsToFetchCombatants.push(...opponentIds, ...allyIds);
        break;
      case TargetCategories.Opponent:
        idsToFetchCombatants.push(...opponentIds);
        break;
      case TargetCategories.Friendly:
        idsToFetchCombatants.push(...allyIds);
        break;
      case TargetCategories.User:
        combatantsToConsider.push(this.combatant);
        break;
    }

    const { party } = this.behaviorContext.combatantContext;

    for (const combatantId of idsToFetchCombatants) {
      const combatant = AdventuringParty.getExpectedCombatant(party, combatantId);
      if (this.filteringFunction(combatant)) combatantsToConsider.push(combatant);
    }

    if (combatantsToConsider.length === 0) {
      return BehaviorNodeState.Failure;
    }

    // this.consideredCombatantsSetter(combatantsToConsider);
    this.behaviorContext.consideredCombatants = combatantsToConsider;

    return BehaviorNodeState.Success;
  }
}
