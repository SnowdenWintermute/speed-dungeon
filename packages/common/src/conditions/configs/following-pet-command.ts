import { AiType } from "../../combat/ai-behavior/index.js";
import { CombatActionIntent } from "../../combat/combat-actions/combat-action-intent.js";
import { CombatActionName } from "../../combat/combat-actions/combat-action-names.js";
import { CombatantConditionConfig, CombatantConditionInit } from "../condition-config.js";

const PET_AI_TYPES_BY_COMMAND_RANK: Record<number, AiType> = {
  [1]: AiType.TargetPetOwnerMostRecentTarget,
  [2]: AiType.TargetLowestHpEnemy,
  [3]: AiType.AlwaysPassTurn,
};

export const PET_COMMAND_AI_TYPE_DESCRIPTIONS_BY_RANK: Record<number, string> = {
  [1]: "Assist",
  [2]: "Kill",
  [3]: "Heel",
};

const PET_COMMAND_AI_TYPE_EXPLANATIONS_BY_RANK: Record<number, string> = {
  [1]: "Targets owner's last hostile target",
  [2]: "Targets vulnerable enemies",
  [3]: "Always passes turn",
};

export function FOLLOWING_PET_COMMAND_CONFIG_CREATOR(
  init: CombatantConditionInit
): CombatantConditionConfig {
  return {
    ...init,
    intent: CombatActionIntent.Benevolent,
    getDescription(self): string {
      return `${PET_COMMAND_AI_TYPE_DESCRIPTIONS_BY_RANK[self.rank]} - ${PET_COMMAND_AI_TYPE_EXPLANATIONS_BY_RANK[self.rank]}`;
    },

    getAiTypesAppliedToTarget(self) {
      const aiTypeOption = PET_AI_TYPES_BY_COMMAND_RANK[self.rank];
      if (aiTypeOption === undefined) {
        return [];
      }

      return [aiTypeOption];
    },
    triggeredWhenHitBy: [CombatActionName.PetCommand],
    onTriggered() {
      return {
        numStacksRemoved: this.stacksOption?.current || 0,
        triggeredActions: [],
      };
    },
  };
}
