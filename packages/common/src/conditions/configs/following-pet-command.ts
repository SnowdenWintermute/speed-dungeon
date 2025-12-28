import makeAutoObservable from "mobx-store-inheritance";
import { AiType } from "../../combat/ai-behavior/index.js";
import { CombatActionIntent } from "../../combat/combat-actions/combat-action-intent.js";
import { CombatActionName } from "../../combat/combat-actions/combat-action-names.js";
import { CombatantConditionInit } from "../condition-config.js";
import { runIfInBrowser } from "../../utils/index.js";
import { CombatantCondition } from "../index.js";

const PET_AI_TYPES_BY_COMMAND_RANK: Record<number, AiType[]> = {
  [1]: [AiType.TargetPetOwnerMostRecentTarget],
  [2]: [AiType.TargetLowestHpEnemy],
  [3]: [AiType.AlwaysPassTurn],
  [4]: [],
};

export const PET_COMMAND_AI_TYPE_DESCRIPTIONS_BY_RANK: Record<number, string> = {
  [1]: "Assist",
  [2]: "Kill",
  [3]: "Heel",
  [4]: "As you like",
};

const PET_COMMAND_AI_TYPE_EXPLANATIONS_BY_RANK: Record<number, string> = {
  [1]: "Targets owner's last hostile target",
  [2]: "Targets vulnerable enemies",
  [3]: "Always passes turn",
  [4]: "Pet does natural behavior",
};

export class FollowingPetCommandCondition extends CombatantCondition {
  constructor(init: CombatantConditionInit) {
    super(init);

    runIfInBrowser(() => makeAutoObservable(this));
  }

  intent = CombatActionIntent.Benevolent;

  getDescription = () => {
    return `${PET_COMMAND_AI_TYPE_DESCRIPTIONS_BY_RANK[this.rank]} - ${PET_COMMAND_AI_TYPE_EXPLANATIONS_BY_RANK[this.rank]}`;
  };

  getAiTypesAppliedToTarget() {
    const aiTypesOption = PET_AI_TYPES_BY_COMMAND_RANK[this.rank];
    if (aiTypesOption === undefined) {
      return [];
    }

    return aiTypesOption;
  }

  triggeredWhenHitBy = [CombatActionName.PetCommand];

  onTriggered() {
    return {
      numStacksRemoved: this.stacksOption?.current || 0,
      triggeredActions: [],
    };
  }
}
