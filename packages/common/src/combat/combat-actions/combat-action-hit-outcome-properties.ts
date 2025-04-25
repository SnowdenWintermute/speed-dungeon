import { ActionResolutionStepContext } from "../../action-processing/index.js";
import { BASE_CRIT_CHANCE, BASE_CRIT_MULTIPLIER } from "../../app-consts";
import { CombatAttribute } from "../../combatants/attributes/index.js";
import { PrimedForIceBurstCombatantCondition } from "../../combatants/combatant-conditions/primed-for-ice-burst";
import { CombatantCondition, CombatantProperties } from "../../combatants/index.js";
import { HoldableSlotType } from "../../items/equipment/slots.js";
import { NormalizedPercentage, NumberRange, Percentage } from "../../primatives/index.js";
import {
  ResourceChangeSource,
  ResourceChangeSourceCategory,
  ResourceChangeSourceConfig,
} from "../hp-change-source-types.js";
import { KineticDamageType } from "../kinetic-damage-types.js";
import { MagicalElement } from "../magical-elements";
import { getAttackResourceChangeProperties } from "./action-implementations/attack/get-attack-hp-change-properties.js";
import { ActionAccuracy, ActionAccuracyType } from "./combat-action-accuracy.js";
import { CombatActionResourceChangeProperties } from "./combat-action-resource-change-properties.js";

export interface CombatActionHitOutcomeProperties {
  accuracyModifier: number;
  getUnmodifiedAccuracy: (user: CombatantProperties) => ActionAccuracy;
  getCritChance: (user: CombatantProperties) => Percentage;
  getCritMultiplier: (user: CombatantProperties) => NormalizedPercentage;
  getArmorPenetration: (
    user: CombatantProperties,
    self: CombatActionHitOutcomeProperties
  ) => number;
  getHpChangeProperties: (
    user: CombatantProperties,
    primaryTarget: CombatantProperties
  ) => null | CombatActionResourceChangeProperties;
  getManaChangeProperties: (
    user: CombatantProperties,
    primaryTarget: CombatantProperties
  ) => null | CombatActionResourceChangeProperties;
  getIsParryable: (user: CombatantProperties) => boolean;
  getIsBlockable: (user: CombatantProperties) => boolean;
  getCanTriggerCounterattack: (user: CombatantProperties) => boolean;
  getAppliedConditions: (context: ActionResolutionStepContext) => null | CombatantCondition[];
}

export enum ActionHitOutcomePropertiesGenericTypes {
  Spell,
  Melee,
  Ranged,
}

const genericActionHitOutcomeProperties: CombatActionHitOutcomeProperties = {
  accuracyModifier: 1,
  getUnmodifiedAccuracy: function (user: CombatantProperties): ActionAccuracy {
    return { type: ActionAccuracyType.Unavoidable };
  },
  getCritChance: (user) => BASE_CRIT_CHANCE,
  getCritMultiplier: (user) => BASE_CRIT_MULTIPLIER,
  getArmorPenetration: (user, self) => 15,
  getHpChangeProperties: (user, primaryTarget) => null,
  getManaChangeProperties: () => null,
  getAppliedConditions: (context) => [],
  getIsParryable: (user) => true,
  getIsBlockable: (user) => true,
  getCanTriggerCounterattack: (user) => true,
};

// export const GENERIC_HIT_OUTCOME_PROPERTIES: CombatActionHitOutcomeProperties = {
//   accuracyModifier: 1,
//   getUnmodifiedAccuracy: function (user: CombatantProperties): ActionAccuracy {
//     // @TODO - base off of activating condition spell level
//     return { type: ActionAccuracyType.Unavoidable };
//   },
//   getCritChance: (user) => BASE_CRIT_CHANCE,
//   getCritMultiplier: (user) => BASE_CRIT_MULTIPLIER,
//   getArmorPenetration: (user, self) => 15,
//   getHpChangeProperties: (user) => {
//     const hpChangeSourceConfig: ResourceChangeSourceConfig = {
//       category: ResourceChangeSourceCategory.Physical,
//       kineticDamageTypeOption: KineticDamageType.Piercing,
//       elementOption: MagicalElement.Ice,
//       isHealing: false,
//       lifestealPercentage: null,
//     };

//     const stacks = user.asUserOfTriggeredCondition?.stacksOption?.current || 1;

//     const baseValues = new NumberRange(user.level * stacks, user.level * stacks * 10);

//     const resourceChangeSource = new ResourceChangeSource(hpChangeSourceConfig);
//     const hpChangeProperties: CombatActionResourceChangeProperties = {
//       resourceChangeSource,
//       baseValues,
//     };

//     return hpChangeProperties;
//   },
//   getManaChangeProperties: () => null,
//   getAppliedConditions: (context) => {
//     const { idGenerator, combatantContext } = context;
//     const { combatant } = combatantContext;

//     const condition = new PrimedForIceBurstCombatantCondition(
//       idGenerator.generate(),
//       combatant.entityProperties.id,
//       combatant.combatantProperties.level
//     );

//     return [condition];
//   },
//   getIsParryable: (user) => false,
//   getIsBlockable: (user) => true,
//   getCanTriggerCounterattack: (user) => false,
// };
