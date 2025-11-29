import { CombatantCondition, CombatantConditionName, ConditionAppliedBy } from "./index.js";
import { CombatActionIntent, CombatActionName } from "../../combat/combat-actions/index.js";
import { EntityId, MaxAndCurrent } from "../../primatives/index.js";
import { CombatantProperties } from "../combatant-properties.js";
import { runIfInBrowser } from "../../utils/index.js";
import makeAutoObservable from "mobx-store-inheritance";
import { AiType } from "../../combat/ai-behavior/index.js";

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

export class FollowingPetCommandCombatantCondition extends CombatantCondition {
  intent = CombatActionIntent.Benevolent;
  removedOnDeath: boolean = true;
  ticks?: MaxAndCurrent | undefined = undefined;
  constructor(
    id: EntityId,
    appliedBy: ConditionAppliedBy,
    appliedTo: EntityId,
    public level: number,
    stacksOption: null | MaxAndCurrent
  ) {
    super(id, appliedBy, appliedTo, CombatantConditionName.FollowingPetCommand, stacksOption);
    runIfInBrowser(() => makeAutoObservable(this));
  }

  tickPropertiesOption = null;

  getAiTypesAppliedToTarget() {
    const aiTypeOption = PET_AI_TYPES_BY_COMMAND_RANK[this.level];
    if (aiTypeOption === undefined) {
      return [];
    }

    return [aiTypeOption];
  }

  getDescription(): string {
    return `${PET_COMMAND_AI_TYPE_DESCRIPTIONS_BY_RANK[this.level]} - ${PET_COMMAND_AI_TYPE_EXPLANATIONS_BY_RANK[this.level]}`;
  }

  getAttributeModifiers(self: CombatantCondition, appliedTo: CombatantProperties) {
    return {};
  }

  triggeredWhenHitBy(actionName: CombatActionName) {
    return false;
  }

  triggeredWhenActionUsed() {
    return false;
  }

  onTriggered() {
    return {
      numStacksRemoved: this.stacksOption?.current || 0,
      triggeredActions: [],
    };
  }

  getCosmeticEffectWhileActive = (combatantId: EntityId) => {
    return [];
  };
}
