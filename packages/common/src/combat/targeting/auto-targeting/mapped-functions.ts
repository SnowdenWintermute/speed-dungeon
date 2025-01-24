import { AutoTargetingScheme } from ".";
import { copyTargetFromParent } from ".";
import { CharacterAssociatedData } from "../../../types";
import { CombatActionComponent } from "../../combat-actions";
import { CombatActionTarget, CombatActionTargetType } from "../combat-action-targets";
import { TargetingCalculator } from "../targeting-calculator";

type AutoTargetingFunction = (
  characterAssociatedData: CharacterAssociatedData,
  combatAction: CombatActionComponent
) => Error | null | CombatActionTarget;

export const AUTO_TARGETING_FUNCTIONS: Record<AutoTargetingScheme, AutoTargetingFunction> = {
  [AutoTargetingScheme.UserPastPreferenceOrDefault]: (
    characterAssociatedData: CharacterAssociatedData,
    combatAction: CombatActionComponent
  ) => {
    const { game, party, character, player } = characterAssociatedData;
    const targetingCalculator = new TargetingCalculator(game, party, character, player);
    return targetingCalculator.getPreferredOrDefaultActionTargets(combatAction);
  },
  [AutoTargetingScheme.CopyParent]: copyTargetFromParent,
  [AutoTargetingScheme.ActionUser]: function (
    characterAssociatedData,
    _combatAction
  ): CombatActionTarget {
    const target: CombatActionTarget = {
      type: CombatActionTargetType.Single,
      targetId: characterAssociatedData.character.entityProperties.id,
    };
    return target;
  },
  [AutoTargetingScheme.BattleGroup]: function (
    characterAssociatedData: CharacterAssociatedData,
    combatAction: CombatActionComponent
  ): CombatActionTarget | Error | null {
    throw new Error("Function not implemented.");
  },
  [AutoTargetingScheme.RandomInGroup]: function (
    characterAssociatedData: CharacterAssociatedData,
    combatAction: CombatActionComponent
  ): CombatActionTarget | Error | null {
    throw new Error("Function not implemented.");
  },
  [AutoTargetingScheme.All]: function (
    characterAssociatedData: CharacterAssociatedData,
    combatAction: CombatActionComponent
  ): CombatActionTarget | Error | null {
    throw new Error("Function not implemented.");
  },
  [AutoTargetingScheme.RandomCombatant]: function (
    characterAssociatedData: CharacterAssociatedData,
    combatAction: CombatActionComponent
  ): CombatActionTarget | Error | null {
    throw new Error("Function not implemented.");
  },
  [AutoTargetingScheme.SpecificSide]: function (
    characterAssociatedData: CharacterAssociatedData,
    combatAction: CombatActionComponent
  ): CombatActionTarget | Error | null {
    throw new Error("Function not implemented.");
  },
  [AutoTargetingScheme.RandomSide]: function (
    characterAssociatedData: CharacterAssociatedData,
    combatAction: CombatActionComponent
  ): CombatActionTarget | Error | null {
    throw new Error("Function not implemented.");
  },
  [AutoTargetingScheme.AllCombatantsWithCondition]: function (
    characterAssociatedData: CharacterAssociatedData,
    combatAction: CombatActionComponent
  ): CombatActionTarget | Error | null {
    throw new Error("Function not implemented.");
  },
  [AutoTargetingScheme.ClosestCombatantWithCondition]: function (
    characterAssociatedData: CharacterAssociatedData,
    combatAction: CombatActionComponent
  ): CombatActionTarget | Error | null {
    throw new Error("Function not implemented.");
  },
  [AutoTargetingScheme.CombatantWithHighestLevelCondition]: function (
    characterAssociatedData: CharacterAssociatedData,
    combatAction: CombatActionComponent
  ): CombatActionTarget | Error | null {
    throw new Error("Function not implemented.");
  },
};
