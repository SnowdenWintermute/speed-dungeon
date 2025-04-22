import {
  CombatActionComponentConfig,
  CombatActionExecutionIntent,
  CombatActionLeaf,
  CombatActionName,
  CombatActionUsabilityContext,
  TargetCategories,
  TargetingScheme,
} from "../../index.js";
import { CombatantCondition } from "../../../../combatants/combatant-conditions/index.js";
import { ProhibitedTargetCombatantStates } from "../../prohibited-target-combatant-states.js";
import { ATTACK } from "./index.js";
import { CombatantProperties } from "../../../../combatants/index.js";
import { CombatAttribute } from "../../../../combatants/attributes/index.js";
import { ActionAccuracyType } from "../../combat-action-accuracy.js";
import { EquipmentSlotType, HoldableSlotType } from "../../../../items/equipment/slots.js";
import { getAttackResourceChangeProperties } from "./get-attack-hp-change-properties.js";
import {
  getStandardActionArmorPenetration,
  getStandardActionCritChance,
  getStandardActionCritMultiplier,
} from "../../action-calculation-utils/standard-action-calculations.js";
import { CombatActionIntent } from "../../combat-action-intent.js";
import { AutoTargetingScheme } from "../../../targeting/auto-targeting/index.js";
import { ActionResolutionStepType } from "../../../../action-processing/index.js";
import { RANGED_ACTIONS_COMMON_CONFIG } from "../ranged-actions-common-config.js";
import { SpawnableEntityType } from "../../../../spawnables/index.js";
import { MobileVfxName, VfxParentType, VfxType } from "../../../../vfx/index.js";
import { getBowShootActionStepAnimations } from "../bow-shoot-action-step-animations.js";
import { TargetingCalculator } from "../../../targeting/targeting-calculator.js";

const config: CombatActionComponentConfig = {
  ...RANGED_ACTIONS_COMMON_CONFIG,
  description: "Attack target using ranged weapon",
  targetingSchemes: [TargetingScheme.Single],
  validTargetCategories: TargetCategories.Opponent,
  autoTargetSelectionMethod: { scheme: AutoTargetingScheme.UserSelected },
  usabilityContext: CombatActionUsabilityContext.InCombat,
  intent: CombatActionIntent.Malicious,
  prohibitedTargetCombatantStates: [
    ProhibitedTargetCombatantStates.Dead,
    ProhibitedTargetCombatantStates.UntargetableByPhysical,
  ],
  prohibitedHitCombatantStates: [],
  baseResourceChangeValuesLevelMultiplier: 1,
  accuracyModifier: 0.9,
  incursDurabilityLoss: { [EquipmentSlotType.Holdable]: { [HoldableSlotType.MainHand]: 1 } },
  costBases: {},
  userShouldMoveHomeOnComplete: true,
  getResourceCosts: () => null,
  requiresCombatTurn: (context) => true,
  shouldExecute: () => true,
  getUnmodifiedAccuracy: (user) => {
    const userCombatAttributes = CombatantProperties.getTotalAttributes(user);
    return {
      type: ActionAccuracyType.Percentage,
      value: userCombatAttributes[CombatAttribute.Accuracy],
    };
  },
  getCritChance: (user) => {
    return getStandardActionCritChance(user, CombatAttribute.Dexterity);
  },
  getCritMultiplier(user) {
    return getStandardActionCritMultiplier(user, CombatAttribute.Dexterity);
  },
  getArmorPenetration(user, self) {
    return getStandardActionArmorPenetration(user, CombatAttribute.Dexterity);
  },
  getHpChangeProperties: (user, primaryTarget, self) => {
    const hpChangeProperties = getAttackResourceChangeProperties(
      self,
      user,
      primaryTarget,
      CombatAttribute.Dexterity,
      HoldableSlotType.MainHand
    );
    return hpChangeProperties;
  },
  getAppliedConditions: function (): CombatantCondition[] | null {
    return null; // ex: could make a "poison blade" item
  },
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
      type: SpawnableEntityType.Vfx,
      vfx: {
        entityProperties: { id: context.idGenerator.generate(), name: "" },
        vfxProperties: {
          vfxType: VfxType.Mobile,
          position,
          name: MobileVfxName.Arrow,
          parentOption: {
            type: VfxParentType.UserMainHand,
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
