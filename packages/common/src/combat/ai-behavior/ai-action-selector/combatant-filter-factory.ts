import { ActionUserContext } from "../../../action-user-context/index.js";
import { CombatantManager } from "../../../adventuring-party/combatant-manager.js";
import { Combatant } from "../../../combatants/index.js";
import { ActionUserType, AdventuringParty, IActionUser } from "../../../index.js";
import { EntityId, NormalizedPercentage } from "../../../primatives/index.js";
import {
  FriendOrFoe,
  TargetCategories,
} from "../../combat-actions/targeting-schemes-and-categories.js";
import { TargetingCalculator } from "../../targeting/targeting-calculator.js";

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

      const { party, actionUser } = actionUserContext;
      const battle = actionUserContext.getBattleOption();

      const combatantIdsByDisposition = actionUserContext.actionUser.getAllyAndOpponentIds(
        party,
        battle
      );

      const allyIds = combatantIdsByDisposition[FriendOrFoe.Friendly];
      const opponentIds = combatantIdsByDisposition[FriendOrFoe.Hostile];
      const neutralIds = combatantIdsByDisposition[FriendOrFoe.Neutral];

      const idsToFetchCombatants: EntityId[] = [];
      switch (targetCategory) {
        case TargetCategories.Any:
          idsToFetchCombatants.push(...opponentIds, ...allyIds, ...neutralIds);
          break;
        case TargetCategories.Opponent:
          // only want to attack neutral that were summoned by an enemy
          const validNeutralOpponents = neutralIds.filter((id) =>
            filterNeutralIdsByDisposition(actionUser, party, id, TargetCategories.Opponent)
          );
          idsToFetchCombatants.push(...opponentIds, ...validNeutralOpponents);
          break;
        case TargetCategories.Friendly:
          // only want to heal neutral that were summoned by an ally like a net
          const validNeutralFriendlies = neutralIds.filter((id) =>
            filterNeutralIdsByDisposition(actionUser, party, id, TargetCategories.Friendly)
          );

          idsToFetchCombatants.push(...allyIds, ...validNeutralFriendlies);
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

  static createIsTopOfThreatMeterFilter(actionUserContext: ActionUserContext) {
    return (combatant: Combatant) => {
      const { actionUser } = actionUserContext;
      const { threatManager } = actionUser.getCombatantProperties();

      if (threatManager === undefined) {
        // no threat meter, so anyone is valid
        return true;
      }

      const topThreatTargetId = threatManager.getHighestThreatCombatantId();

      // no one is on the threat meter yet so all targets are valid
      if (topThreatTargetId === null) {
        return true;
      }

      return topThreatTargetId === combatant.getEntityId();
    };
  }

  static createIsRecentTargetOfPetOwner(
    actionUserContext: ActionUserContext,
    targetDisposition: FriendOrFoe
  ) {
    return (combatant: Combatant) => {
      const { party, actionUser } = actionUserContext;
      // get owner of this action user
      const { controlledBy } = actionUser.getCombatantProperties();
      const summonedByCombatant = controlledBy.getExpectedSummonedByCombatant(party);

      // get most recent targets of owner
      const ownerPreferredTargets = summonedByCombatant
        .getTargetingProperties()
        .getTargetPreferences()
        .getPreferredTargetsInCategory(targetDisposition);

      if (ownerPreferredTargets === null) {
        return false;
      } else {
        // check if this combatant is on the list of owner's most recent targets
        // @PERF - recreating a new targetingCalculator here could be moved to a singleton
        // and just modified here
        const targetingCalculator = new TargetingCalculator(actionUserContext, null);
        const targetIds = targetingCalculator.getTargetIds(ownerPreferredTargets, []);

        if (targetIds instanceof Error) {
          console.error(targetIds);
          return false;
        }

        const shouldConsiderThisTarget = targetIds.includes(combatant.getEntityId());

        return shouldConsiderThisTarget;
      }
    };
  }
}

function filterNeutralIdsByDisposition(
  actionUser: IActionUser,
  party: AdventuringParty,
  neutralEntityId: EntityId,
  disposition: TargetCategories
) {
  if (disposition === TargetCategories.Any || disposition === TargetCategories.User) {
    return true;
  }

  if (actionUser.getType() !== ActionUserType.Combatant) {
    return true;
  }

  const combatant = party.combatantManager.getCombatantOption(neutralEntityId);
  const summonedByIdOption = combatant?.combatantProperties.controlledBy.summonedBy;
  if (summonedByIdOption === undefined) {
    return false;
  }

  const summonedByCombatant = party.combatantManager.getCombatantOption(summonedByIdOption);
  const summonedByIsAlly =
    summonedByCombatant !== undefined &&
    CombatantManager.combatantsAreAllies(summonedByCombatant, actionUser as Combatant);

  if (disposition === TargetCategories.Friendly) {
    return summonedByIsAlly;
  } else {
    return !summonedByIsAlly;
  }
}
