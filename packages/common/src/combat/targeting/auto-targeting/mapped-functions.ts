import { AutoTargetingScheme } from "./index.js";
import { copyTargetFromParent } from "./copy-from-parent.js";
import { CombatantAssociatedData } from "../../../types.js";
import { CombatActionComponent } from "../../combat-actions/index.js";
import { CombatActionTarget, CombatActionTargetType } from "../combat-action-targets.js";
import { CombatantContext } from "../../../combatant-context/index.js";

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
};
