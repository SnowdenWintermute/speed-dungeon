import { Combatant } from "../../../combatants/index.js";
import { EntityId } from "../../../primatives/index.js";
import { AIBehaviorContext } from "../ai-context.js";
import { BehaviorNode, BehaviorNodeState } from "../behavior-tree.js";
import {
  FriendOrFoe,
  TargetCategories,
} from "../../combat-actions/targeting-schemes-and-categories.js";
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

    const { party } = this.behaviorContext.actionUserContext;
    const battle = this.behaviorContext.actionUserContext.getBattleOption();

    const combatantIdsByDisposition =
      this.behaviorContext.actionUserContext.actionUser.getAllyAndOpponentIds(party, battle);
    const allyIds = combatantIdsByDisposition[FriendOrFoe.Friendly];
    const opponentIds = combatantIdsByDisposition[FriendOrFoe.Hostile];

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

    for (const combatantId of idsToFetchCombatants) {
      const combatant = party.combatantManager.getExpectedCombatant(combatantId);
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
