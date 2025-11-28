import { ActionUserContext } from "../../../action-user-context/index.js";
import { Combatant } from "../../../combatants/index.js";
import { EntityId, NormalizedPercentage } from "../../../primatives/index.js";
import {
  FriendOrFoe,
  TargetCategories,
} from "../../combat-actions/targeting-schemes-and-categories.js";

export class CombatantFilterFactory {
  static createBelowHpThresholdFilter(threshold: NormalizedPercentage) {
    return (combatant: Combatant) => {
      const hitPointsCount = combatant.combatantProperties.resources.getHitPoints();
      if (hitPointsCount === 0) {
        return 0 < threshold;
      }

      const percentages = combatant.combatantProperties.resources.getResourcePercentagesOfMax();
      const { percentOfMaxHitPoints } = percentages;
      return percentOfMaxHitPoints < threshold;
    };
  }

  static createIsInTargetCategoryFilter(
    targetCategory: TargetCategories,
    actionUserContext: ActionUserContext
  ) {
    return (combatant: Combatant) => {
      const combatantsToConsider: Combatant[] = [];

      const { party } = actionUserContext;
      const battle = actionUserContext.getBattleOption();

      const combatantIdsByDisposition = actionUserContext.actionUser.getAllyAndOpponentIds(
        party,
        battle
      );

      const allyIds = combatantIdsByDisposition[FriendOrFoe.Friendly];
      const opponentIds = combatantIdsByDisposition[FriendOrFoe.Hostile];

      const idsToFetchCombatants: EntityId[] = [];
      switch (targetCategory) {
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
          combatantsToConsider.push(combatant);
          break;
      }

      for (const combatantId of idsToFetchCombatants) {
        const combatant = party.combatantManager.getExpectedCombatant(combatantId);
        combatantsToConsider.push(combatant);
      }

      return combatantsToConsider
        .map((combatant) => combatant.getEntityId())
        .includes(combatant.getEntityId());
    };
  }
}
