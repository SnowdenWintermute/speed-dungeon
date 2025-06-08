import { AutoTargetingScheme } from "./index.js";
import { copyTargetFromParent } from "./copy-from-parent.js";
import { CombatantAssociatedData } from "../../../types.js";
import { CombatActionComponent } from "../../combat-actions/index.js";
import { CombatActionTarget, CombatActionTargetType } from "../combat-action-targets.js";
import { CombatantContext } from "../../../combatant-context/index.js";
import { TargetingCalculator } from "../targeting-calculator.js";
import { filterPossibleTargetIdsByActionTargetCategories } from "../filtering.js";
import { Battle } from "../../../battle/index.js";
import { AdventuringParty } from "../../../adventuring-party/index.js";
import { EntityId } from "../../../primatives/index.js";
import { Vector3 } from "@babylonjs/core";
import { ERROR_MESSAGES } from "../../../errors/index.js";

type AutoTargetingFunction = (
  combatantContext: CombatantContext,
  combatAction: CombatActionComponent
) => Error | null | CombatActionTarget;

export const AUTO_TARGETING_FUNCTIONS: Record<AutoTargetingScheme, AutoTargetingFunction> = {
  [AutoTargetingScheme.UserSelected]: (
    combatantContext: CombatantAssociatedData,
    combatAction: CombatActionComponent
  ) => {
    const { combatant } = combatantContext;
    return combatant.combatantProperties.combatActionTarget;
  },
  [AutoTargetingScheme.CopyParent]: copyTargetFromParent,
  [AutoTargetingScheme.ActionUser]: function (
    combatantContext: CombatantAssociatedData,
    combatAction: CombatActionComponent
  ): CombatActionTarget {
    const target: CombatActionTarget = {
      type: CombatActionTargetType.Single,
      targetId: combatantContext.combatant.entityProperties.id,
    };
    return target;
  },
  [AutoTargetingScheme.BattleGroup]: function (
    combatantContext: CombatantAssociatedData,
    combatAction: CombatActionComponent
  ): CombatActionTarget | Error | null {
    throw new Error("Function not implemented.");
  },
  [AutoTargetingScheme.RandomInGroup]: function (
    combatantContext: CombatantAssociatedData,
    combatAction: CombatActionComponent
  ): CombatActionTarget | Error | null {
    throw new Error("Function not implemented.");
  },
  [AutoTargetingScheme.All]: function (
    combatantContext: CombatantAssociatedData,
    combatAction: CombatActionComponent
  ): CombatActionTarget | Error | null {
    throw new Error("Function not implemented.");
  },
  [AutoTargetingScheme.RandomCombatant]: function (
    combatantContext: CombatantAssociatedData,
    combatAction: CombatActionComponent
  ): CombatActionTarget | Error | null {
    throw new Error("Function not implemented.");
  },
  [AutoTargetingScheme.SpecificSide]: function (
    combatantContext: CombatantAssociatedData,
    combatAction: CombatActionComponent
  ): CombatActionTarget | Error | null {
    throw new Error("Function not implemented.");
  },
  [AutoTargetingScheme.RandomSide]: function (
    combatantContext: CombatantAssociatedData,
    combatAction: CombatActionComponent
  ): CombatActionTarget | Error | null {
    throw new Error("Function not implemented.");
  },
  [AutoTargetingScheme.AllCombatantsWithCondition]: function (
    combatantContext: CombatantAssociatedData,
    combatAction: CombatActionComponent
  ): CombatActionTarget | Error | null {
    throw new Error("Function not implemented.");
  },
  [AutoTargetingScheme.ClosestCombatantWithCondition]: function (
    combatantContext: CombatantAssociatedData,
    combatAction: CombatActionComponent
  ): CombatActionTarget | Error | null {
    throw new Error("Function not implemented.");
  },
  [AutoTargetingScheme.CombatantWithHighestLevelCondition]: function (
    combatantContext: CombatantAssociatedData,
    combatAction: CombatActionComponent
  ): CombatActionTarget | Error | null {
    throw new Error("Function not implemented.");
  },
  [AutoTargetingScheme.SelfAndSides]: function (
    combatantContext: CombatantContext,
    combatAction: CombatActionComponent
  ): CombatActionTarget | Error | null {
    const target: CombatActionTarget = {
      type: CombatActionTargetType.SingleAndSides,
      targetId: combatantContext.combatant.entityProperties.id,
    };
    return target;
  },
  [AutoTargetingScheme.Sides]: function (
    combatantContext: CombatantContext,
    combatAction: CombatActionComponent
  ): Error | CombatActionTarget | null {
    throw new Error("Function not implemented.");
  },
  [AutoTargetingScheme.WithinRadiusOfEntity]: function (
    combatantContext: CombatantContext,
    combatAction: CombatActionComponent
  ): Error | null | CombatActionTarget {
    const { scheme } = combatAction.targetingProperties.autoTargetSelectionMethod;

    if (scheme !== AutoTargetingScheme.WithinRadiusOfEntity)
      throw new Error("mismatched auto targeting scheme");

    const { radius, validTargetCategories } =
      combatAction.targetingProperties.autoTargetSelectionMethod;

    // get all combatants in area
    // filter by valid categories (they will be filtered by valid combatant states at execution time)
    const { party, combatant } = combatantContext;

    const allyAndOpponentIds = combatantContext.getAllyAndOpponentIds();

    const idsFilteredByTargetCategory = filterPossibleTargetIdsByActionTargetCategories(
      validTargetCategories,
      combatant.entityProperties.id,
      allyAndOpponentIds.allyIds,
      allyAndOpponentIds.opponentIds
    );
    const idsFilteredByTargetCategoryFlattened = [
      ...idsFilteredByTargetCategory[0],
      ...idsFilteredByTargetCategory[1],
    ];

    const { combatActionTarget } = combatant.combatantProperties;
    const targetId = (() => {
      if (combatActionTarget?.type === CombatActionTargetType.Single)
        return combatActionTarget.targetId;
    })();
    if (targetId === undefined) throw new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NO_TARGET_PROVIDED);

    console.log("target entity for within radius: ", targetId);

    // get all combatants within radius of combatant location
    const mainTargetCombatant = AdventuringParty.getCombatant(party, targetId);
    if (mainTargetCombatant instanceof Error) throw mainTargetCombatant;
    const mainTargetPosition = mainTargetCombatant.combatantProperties.position;
    const validTargetsWithinRadius: EntityId[] = [];

    for (const potentialTargetId of idsFilteredByTargetCategoryFlattened) {
      const potentialTargetCombatant = AdventuringParty.getCombatant(party, potentialTargetId);
      if (potentialTargetCombatant instanceof Error) throw potentialTargetCombatant;
      const { position } = potentialTargetCombatant.combatantProperties;
      const distanceFromMainTarget = Vector3.Distance(mainTargetPosition, position);

      console.log(
        "distance",
        mainTargetCombatant.entityProperties.id,
        "from",
        potentialTargetCombatant.entityProperties.id,
        ":",
        distanceFromMainTarget
      );

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
