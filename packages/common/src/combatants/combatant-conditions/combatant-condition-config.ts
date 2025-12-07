import {
  ActionIntentAndUser,
  ActionUserContext,
  AiType,
  CombatActionIntent,
  CombatActionName,
  Combatant,
  CombatantAttributeRecord,
  CombatantConditionName,
  CombatantProperties,
  ConditionTickProperties,
  CosmeticEffectOnTargetTransformNode,
  EntityId,
  IdGenerator,
  MaxAndCurrent,
  TransformModifiers,
} from "../../index.js";
import { CombatantCondition, ConditionAppliedBy } from "./index.js";

export interface CombatantConditionInit {
  name: CombatantConditionName;
  rank: number;
  id: EntityId;
  appliedBy: ConditionAppliedBy;
  appliedTo: EntityId;
}

export interface CombatantConditionConfig {
  // must specify
  rank: number;
  id: EntityId;
  appliedBy: ConditionAppliedBy;
  appliedTo: EntityId;
  name: CombatantConditionName;

  intent: CombatActionIntent;
  getDescription?(self: CombatantCondition): string;

  /** As action user, this condition's attributes */
  combatAttributes?: CombatantAttributeRecord;
  /** How this condition affects the appliedTo combatant */
  getAttributeModifiers?(
    self: CombatantCondition,
    appliedTo: CombatantProperties
  ): CombatantAttributeRecord;
  getAiTypesAppliedToTarget?(self: CombatantCondition): AiType[];
  stacksOption?: MaxAndCurrent;
  tickPropertiesOption?: ConditionTickProperties;

  // triggers
  removedOnDeath?: boolean;
  triggeredWhenHitBy?: CombatActionName[];
  onTriggered?(
    self: CombatantCondition,
    actionUserContext: ActionUserContext,
    combatantThisIsAppliedTo: Combatant,
    idGenerator: IdGenerator
  ): {
    numStacksRemoved: number;
    triggeredActions: ActionIntentAndUser[];
  };

  getCosmeticEffectWhileActive?(
    self: CombatantCondition,
    appliedToId: EntityId
  ): CosmeticEffectOnTargetTransformNode[];
  getTransformModifiers?(): TransformModifiers;
}
