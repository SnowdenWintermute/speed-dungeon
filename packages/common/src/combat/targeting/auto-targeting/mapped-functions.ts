import { AutoTargetingScheme } from "./index.js";
import { CombatActionComponent, FriendOrFoe } from "../../combat-actions/index.js";
import { CombatActionTarget, CombatActionTargetType } from "../combat-action-targets.js";
import { AdventuringParty } from "../../../adventuring-party/index.js";
import { EntityId } from "../../../primatives/index.js";
import { Vector3 } from "@babylonjs/core";
import { ERROR_MESSAGES } from "../../../errors/index.js";
import { TargetFilterer } from "../filtering.js";
import { ActionUserContext } from "../../../action-user-context/index.js";

type AutoTargetingFunction = (
  actionUserContext: ActionUserContext,
  combatAction: CombatActionComponent
) => Error | null | CombatActionTarget;

export const AUTO_TARGETING_FUNCTIONS: Record<AutoTargetingScheme, AutoTargetingFunction> = {
  [AutoTargetingScheme.UserSelected]: (
    actionUserContext: ActionUserContext,
    combatAction: CombatActionComponent
  ) => {
    const { actionUser } = actionUserContext;
    return actionUser.getTargetingProperties().getSelectedTarget();
  },
  [AutoTargetingScheme.CopyParent]: (
    actionUserContext: ActionUserContext,
    combatAction: CombatActionComponent
  ) => {
    const parent = combatAction.hierarchyProperties.getParent();
    if (parent) return parent.targetingProperties.getAutoTarget(actionUserContext, null);
    return null;
  },
  [AutoTargetingScheme.ActionUser]: function (
    actionUserContext: ActionUserContext,
    combatAction: CombatActionComponent
  ): CombatActionTarget {
    const target: CombatActionTarget = {
      type: CombatActionTargetType.Single,
      targetId: actionUserContext.actionUser.getEntityId(),
    };
    return target;
  },
  [AutoTargetingScheme.All]: function (
    actionUserContext: ActionUserContext,
    combatAction: CombatActionComponent
  ): CombatActionTarget | Error | null {
    throw new Error("Function not implemented.");
  },
  [AutoTargetingScheme.RandomCombatant]: function (
    actionUserContext: ActionUserContext,
    combatAction: CombatActionComponent
  ): CombatActionTarget | Error | null {
    throw new Error("Function not implemented.");
  },
  [AutoTargetingScheme.WithinRadiusOfEntity]: function (
    actionUserContext: ActionUserContext,
    combatAction: CombatActionComponent
  ): Error | null | CombatActionTarget {
    const { scheme } = combatAction.targetingProperties.autoTargetSelectionMethod;

    if (scheme !== AutoTargetingScheme.WithinRadiusOfEntity)
      throw new Error("mismatched auto targeting scheme");

    const { radius, validTargetCategories, excludePrimaryTarget } =
      combatAction.targetingProperties.autoTargetSelectionMethod;

    // get all combatants in area
    // filter by valid categories (they will be filtered by valid combatant states at execution time)
    const { party, actionUser } = actionUserContext;

    const targetIdsByDisposition = actionUserContext.getAllyAndOpponentIds();

    TargetFilterer.filterPossibleTargetIdsByActionTargetCategories(
      validTargetCategories,
      actionUser.getEntityId(),
      targetIdsByDisposition
    );

    const idsFilteredByTargetCategoryFlattened = [
      ...targetIdsByDisposition[FriendOrFoe.Hostile],
      ...targetIdsByDisposition[FriendOrFoe.Friendly],
    ];

    const targetingProperties = actionUser.getTargetingProperties();

    const combatActionTarget = targetingProperties.getSelectedTarget();
    const targetId = (() => {
      if (combatActionTarget?.type === CombatActionTargetType.Single)
        return combatActionTarget.targetId;
    })();

    if (targetId === undefined) throw new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NO_TARGET_PROVIDED);

    // get all combatants within radius of combatant location
    const mainTargetCombatant = AdventuringParty.getCombatant(party, targetId);
    if (mainTargetCombatant instanceof Error) throw mainTargetCombatant;
    const mainTargetPosition = mainTargetCombatant.combatantProperties.position;
    const validTargetsWithinRadius: EntityId[] = [];

    for (const potentialTargetId of idsFilteredByTargetCategoryFlattened) {
      if (excludePrimaryTarget && potentialTargetId === targetId) continue;

      const potentialTargetCombatant = AdventuringParty.getCombatant(party, potentialTargetId);
      if (potentialTargetCombatant instanceof Error) throw potentialTargetCombatant;
      const { position } = potentialTargetCombatant.combatantProperties;
      const distanceFromMainTarget = Vector3.Distance(mainTargetPosition, position);

      if (distanceFromMainTarget <= radius) validTargetsWithinRadius.push(potentialTargetId);
    }

    // return their ids
    const target: CombatActionTarget = {
      type: CombatActionTargetType.DistinctIds,
      targetIds: validTargetsWithinRadius,
    };

    return target;
  },
};
