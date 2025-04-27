import {
  CombatActionComponentConfig,
  CombatActionExecutionIntent,
  CombatActionLeaf,
  CombatActionName,
  CombatActionUsabilityContext,
} from "../../index.js";
import { ATTACK } from "./index.js";
import { EquipmentSlotType, HoldableSlotType } from "../../../../items/equipment/slots.js";
import { CombatActionIntent } from "../../combat-action-intent.js";
import { ActionResolutionStepType } from "../../../../action-processing/index.js";
import { RANGED_ACTIONS_COMMON_CONFIG } from "../ranged-actions-common-config.js";
import { SpawnableEntityType } from "../../../../spawnables/index.js";
import { getBowShootActionStepAnimations } from "../bow-shoot-action-step-animations.js";
import { TargetingCalculator } from "../../../targeting/targeting-calculator.js";
import { ActionEntityName, AbstractParentType } from "../../../../action-entities/index.js";
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

const targetingProperties = GENERIC_TARGETING_PROPERTIES[TargetingPropertiesTypes.HostileSingle];

const config: CombatActionComponentConfig = {
  ...RANGED_ACTIONS_COMMON_CONFIG,
  description: "Attack target using ranged weapon",
  targetingProperties,
  hitOutcomeProperties: rangedAttackProjectileHitOutcomeProperties,
  costProperties: {
    ...BASE_ACTION_COST_PROPERTIES[ActionCostPropertiesBaseTypes.Base],
    incursDurabilityLoss: {
      [EquipmentSlotType.Holdable]: { [HoldableSlotType.MainHand]: DurabilityLossCondition.OnUse },
    },
  },
  usabilityContext: CombatActionUsabilityContext.InCombat,
  intent: CombatActionIntent.Malicious,
  userShouldMoveHomeOnComplete: true,
  shouldExecute: () => true,
  getConcurrentSubActions(context) {
    const { combatActionTarget } = context.combatant.combatantProperties;
    if (!combatActionTarget) throw new Error("expected combatant target not found");
    return [
      new CombatActionExecutionIntent(
        CombatActionName.AttackRangedMainhandProjectile,
        combatActionTarget
      ),
    ];
  },
  getChildren: () => [],
  getParent: () => ATTACK,
  getResolutionSteps() {
    return [
      ActionResolutionStepType.DetermineActionAnimations,
      ActionResolutionStepType.InitialPositioning,
      ActionResolutionStepType.ChamberingMotion,
      ActionResolutionStepType.PostChamberingSpawnEntity,
      ActionResolutionStepType.DeliveryMotion,
      ActionResolutionStepType.PayResourceCosts,
      ActionResolutionStepType.EvalOnUseTriggers,
      ActionResolutionStepType.StartConcurrentSubActions,
      ActionResolutionStepType.RecoveryMotion,
    ];
  },
  getActionStepAnimations: getBowShootActionStepAnimations,
  getSpawnableEntity: (context) => {
    const { combatantContext } = context;
    const position = combatantContext.combatant.combatantProperties.position.clone();
    const { actionExecutionIntent } = context.tracker;
    const { party } = combatantContext;

    const targetingCalculator = new TargetingCalculator(context.combatantContext, null);

    const primaryTargetResult = targetingCalculator.getPrimaryTargetCombatant(
      party,
      actionExecutionIntent
    );
    if (primaryTargetResult instanceof Error) throw primaryTargetResult;
    const target = primaryTargetResult;

    return {
      type: SpawnableEntityType.ActionEntity,
      actionEntity: {
        entityProperties: { id: context.idGenerator.generate(), name: "" },
        actionEntityProperties: {
          position,
          name: ActionEntityName.Arrow,
          parentOption: {
            type: AbstractParentType.UserMainHand,
            parentEntityId: context.combatantContext.combatant.entityProperties.id,
          },
          pointTowardEntityOption: target.entityProperties.id,
        },
      },
    };
  },
};

export const ATTACK_RANGED_MAIN_HAND = new CombatActionLeaf(
  CombatActionName.AttackRangedMainhand,
  config
);
