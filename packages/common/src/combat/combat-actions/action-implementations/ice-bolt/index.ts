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
import { CombatantProperties } from "../../../../combatants/index.js";
import { CombatAttribute } from "../../../../combatants/attributes/index.js";
import { ActionAccuracyType } from "../../combat-action-accuracy.js";
import { EquipmentSlotType, HoldableSlotType } from "../../../../items/equipment/slots.js";
import {
  getStandardActionCritChance,
  getStandardActionCritMultiplier,
} from "../../action-calculation-utils/standard-action-calculations.js";
import { CombatActionIntent } from "../../combat-action-intent.js";
import { AutoTargetingScheme } from "../../../targeting/auto-targeting/index.js";
import { ActionResolutionStepType } from "../../../../action-processing/index.js";
import { RANGED_ACTIONS_COMMON_CONFIG } from "../ranged-actions-common-config.js";
import { SpawnableEntityType } from "../../../../spawnables/index.js";
import { MobileVfxName, VfxParentType, VfxType } from "../../../../vfx/index.js";
import {
  ResourceChangeSource,
  ResourceChangeSourceCategory,
  ResourceChangeSourceConfig,
} from "../../../hp-change-source-types.js";
import { MagicalElement } from "../../../magical-elements.js";
import { NumberRange } from "../../../../primatives/number-range.js";
import { addCombatantLevelScaledAttributeToRange } from "../../../action-results/action-hit-outcome-calculation/add-combatant-level-scaled-attribute-to-range.js";
import { CombatActionResourceChangeProperties } from "../../combat-action-resource-change-properties.js";
import { getSpellCastActionStepAnimations } from "../spell-cast-action-step-animations.js";
import { ClientOnlyVfxNames } from "../../../../vfx/client-only-vfx.js";

const config: CombatActionComponentConfig = {
  ...RANGED_ACTIONS_COMMON_CONFIG,
  description: "Summon an icy projectile",
  targetingSchemes: [TargetingScheme.Single],
  validTargetCategories: TargetCategories.Opponent,
  autoTargetSelectionMethod: { scheme: AutoTargetingScheme.UserSelected },
  usabilityContext: CombatActionUsabilityContext.InCombat,
  intent: CombatActionIntent.Malicious,
  prohibitedTargetCombatantStates: [
    ProhibitedTargetCombatantStates.Dead,
    ProhibitedTargetCombatantStates.UntargetableByPhysical,
    ProhibitedTargetCombatantStates.UntargetableBySpells,
  ],
  baseResourceChangeValuesLevelMultiplier: 1,
  accuracyModifier: 0.9,
  incursDurabilityLoss: {},
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
    return getStandardActionCritChance(user, CombatAttribute.Focus);
  },
  getCritMultiplier(user) {
    return getStandardActionCritMultiplier(user, CombatAttribute.Focus);
  },
  getArmorPenetration(user, self) {
    return 0;
  },
  getHpChangeProperties: (user, primaryTarget, self) => {
    const hpChangeSourceConfig: ResourceChangeSourceConfig = {
      category: ResourceChangeSourceCategory.Magical,
      kineticDamageTypeOption: null,
      elementOption: MagicalElement.Ice,
      isHealing: false,
      lifestealPercentage: null,
    };

    const baseValues = new NumberRange(4, 8);

    // just get some extra damage for combatant level
    baseValues.add(user.level - 1);
    // get greater benefits from a certain attribute the higher level a combatant is
    addCombatantLevelScaledAttributeToRange({
      range: baseValues,
      combatantProperties: user,
      attribute: CombatAttribute.Intelligence,
      normalizedAttributeScalingByCombatantLevel: 1,
    });

    const resourceChangeSource = new ResourceChangeSource(hpChangeSourceConfig);
    const hpChangeProperties: CombatActionResourceChangeProperties = {
      resourceChangeSource,
      baseValues,
    };

    baseValues.floor();

    return hpChangeProperties;
  },
  getAppliedConditions: function (): CombatantCondition[] | null {
    return null; // ex: could make a "poison blade" item
  },
  getConcurrentSubActions(context) {
    const { combatActionTarget } = context.combatant.combatantProperties;
    if (!combatActionTarget) throw new Error("expected combatant target not found");
    return [
      new CombatActionExecutionIntent(CombatActionName.IceBoltProjectile, combatActionTarget),
    ];
  },
  getChildren: () => [],
  getParent: () => null,
  getClientOnlyVfxToStartByStep(context) {
    return {
      [ActionResolutionStepType.InitialPositioning]: [
        {
          name: ClientOnlyVfxNames.FrostParticleAccumulation,
          parentType: VfxParentType.UserOffHand,
        },
      ],
    };
  },
  getClientOnlyVfxToStopByStep(context) {
    return {
      [ActionResolutionStepType.FinalPositioning]: [ClientOnlyVfxNames.FrostParticleAccumulation],
    };
  },
  getResolutionSteps() {
    return [
      ActionResolutionStepType.DetermineActionAnimations,
      // spawn spellcasting glyph at feet
      ActionResolutionStepType.InitialPositioning,
      // spawn particle effect on hand
      ActionResolutionStepType.ChamberingMotion,
      ActionResolutionStepType.DeliveryMotion,
      // despawn original particle effect
      // spawn particle effect burst
      // despawn spellcasting glyph
      ActionResolutionStepType.PayResourceCosts,
      ActionResolutionStepType.EvalOnUseTriggers,
      ActionResolutionStepType.StartConcurrentSubActions,
      ActionResolutionStepType.RecoveryMotion,
    ];
  },
  getActionStepAnimations: getSpellCastActionStepAnimations,
};

export const ICE_BOLT_PARENT = new CombatActionLeaf(CombatActionName.IceBoltParent, config);
