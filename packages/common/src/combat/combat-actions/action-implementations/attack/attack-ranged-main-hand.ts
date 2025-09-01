import {
  CombatActionCombatLogProperties,
  CombatActionComponentConfig,
  CombatActionExecutionIntent,
  CombatActionLeaf,
  CombatActionName,
  CombatActionOrigin,
} from "../../index.js";
import { ATTACK } from "./index.js";
import { EquipmentSlotType, HoldableSlotType } from "../../../../items/equipment/slots.js";
import {
  GENERIC_TARGETING_PROPERTIES,
  TargetingPropertiesTypes,
} from "../../combat-action-targeting-properties.js";
import { rangedAttackProjectileHitOutcomeProperties } from "./attack-ranged-main-hand-projectile.js";
import {
  ActionCostPropertiesBaseTypes,
  BASE_ACTION_COST_PROPERTIES,
} from "../../combat-action-cost-properties.js";
import { DurabilityLossCondition } from "../../combat-action-durability-loss-condition.js";
import { SkeletalAnimationName } from "../../../../app-consts.js";
import { EquipmentType, TwoHandedRangedWeapon } from "../../../../items/equipment/index.js";
import { BASE_ACTION_HIERARCHY_PROPERTIES } from "../../index.js";
import { ACTION_STEPS_CONFIG_TEMPLATE_GETTERS } from "../generic-action-templates/step-config-templates/index.js";

export const BOW_EQUIPMENT_ANIMATIONS: Record<TwoHandedRangedWeapon, SkeletalAnimationName> = {
  [TwoHandedRangedWeapon.ShortBow]: SkeletalAnimationName.EquipmentShortBowShoot,
  [TwoHandedRangedWeapon.RecurveBow]: SkeletalAnimationName.EquipmentRecurveBowShoot,
  [TwoHandedRangedWeapon.CompositeBow]: SkeletalAnimationName.EquipmentCompositeBowShoot,
  [TwoHandedRangedWeapon.MilitaryBow]: SkeletalAnimationName.EquipmentMilitaryBowShoot,
  [TwoHandedRangedWeapon.EtherBow]: SkeletalAnimationName.EquipmentEtherBowShoot,
};

const stepsConfig = ACTION_STEPS_CONFIG_TEMPLATE_GETTERS.BOW_SKILL();

export const ATTACK_RANGED_MAIN_HAND_CONFIG: CombatActionComponentConfig = {
  description: "Attack target using ranged weapon",
  combatLogMessageProperties: new CombatActionCombatLogProperties({
    origin: CombatActionOrigin.Attack,
  }),
  targetingProperties: {
    ...GENERIC_TARGETING_PROPERTIES[TargetingPropertiesTypes.HostileSingle],
    getRequiredEquipmentTypeOptions: () => [EquipmentType.TwoHandedRangedWeapon],
  },
  hitOutcomeProperties: rangedAttackProjectileHitOutcomeProperties,
  costProperties: {
    ...BASE_ACTION_COST_PROPERTIES[ActionCostPropertiesBaseTypes.Base],
    incursDurabilityLoss: {
      [EquipmentSlotType.Holdable]: { [HoldableSlotType.MainHand]: DurabilityLossCondition.OnUse },
    },
    requiresCombatTurnInThisContext: () => false,
  },
  stepsConfig,

  hierarchyProperties: {
    ...BASE_ACTION_HIERARCHY_PROPERTIES,
    getParent: () => ATTACK,
    getConcurrentSubActions(context) {
      return [
        new CombatActionExecutionIntent(
          CombatActionName.AttackRangedMainhandProjectile,
          context.tracker.actionExecutionIntent.targets,
          context.tracker.actionExecutionIntent.level
        ),
      ];
    },
  },
};

export const ATTACK_RANGED_MAIN_HAND = new CombatActionLeaf(
  CombatActionName.AttackRangedMainhand,
  ATTACK_RANGED_MAIN_HAND_CONFIG
);
