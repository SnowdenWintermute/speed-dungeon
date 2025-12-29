import { ActionIntentAndUser } from "../action-processing/action-steps/index.js";
import { ActionUserContext } from "../action-user-context/index.js";
import { EntityId } from "../aliases.js";
import { AiType } from "../combat/ai-behavior/index.js";
import { CombatActionIntent } from "../combat/combat-actions/combat-action-intent.js";
import { CombatActionName } from "../combat/combat-actions/combat-action-names.js";
import { CosmeticEffectOnTargetTransformNode } from "../combat/combat-actions/combat-action-steps-config.js";
import { CombatantAttributeRecord } from "../combatants/combatant-attribute-record.js";
import { CombatantProperties } from "../combatants/combatant-properties.js";
import { Combatant } from "../combatants/index.js";
import { MaxAndCurrent } from "../primatives/max-and-current.js";
import { TransformModifiers } from "../scene-entities/index.js";
import { IdGenerator } from "../utility-classes/index.js";
import { ConditionAppliedBy } from "./condition-applied-by.js";
import { CombatantConditionName } from "./condition-names.js";
import { ConditionTickProperties } from "./condition-tick-properties.js";
import { CombatantCondition } from "./index.js";

export interface CombatantConditionInit {
  name: CombatantConditionName;
  rank: number;
  id: EntityId;
  appliedBy: ConditionAppliedBy;
  appliedTo: EntityId;
  stacks: number | null;
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
