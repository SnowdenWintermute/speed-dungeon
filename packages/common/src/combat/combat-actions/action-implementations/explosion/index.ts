import {
  CombatActionAnimationPhase,
  CombatActionCombatantAnimations,
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionName,
  CombatActionUsabilityContext,
  FriendOrFoe,
  TargetCategories,
  TargetingScheme,
} from "../../index.js";
import { CombatantProperties } from "../../../../combatants/index.js";
import { ProhibitedTargetCombatantStates } from "../../prohibited-target-combatant-states.js";
import { ActionAccuracy, ActionAccuracyType } from "../../combat-action-accuracy.js";
import { CombatActionRequiredRange } from "../../combat-action-range.js";
import { AutoTargetingScheme } from "../../../targeting/auto-targeting/index.js";
import { CombatActionIntent } from "../../combat-action-intent.js";
import { NON_COMBATANT_INITIATED_ACTIONS_COMMON_CONFIG } from "../non-combatant-initiated-actions-common-config.js";
import {
  ActionMotionPhase,
  ActionResolutionStepType,
  AnimationTimingType,
} from "../../../../action-processing/index.js";
import {
  ResourceChangeSource,
  ResourceChangeSourceCategory,
  ResourceChangeSourceConfig,
} from "../../../hp-change-source-types.js";
import { MagicalElement } from "../../../magical-elements.js";
import { NumberRange } from "../../../../primatives/number-range.js";
import {
  AnimationType,
  BASE_CRIT_CHANCE,
  BASE_CRIT_MULTIPLIER,
  DynamicAnimationName,
} from "../../../../app-consts.js";
import { SpawnableEntityType } from "../../../../spawnables/index.js";
import { MobileVfxName, VfxType } from "../../../../vfx/index.js";
import { TargetingCalculator } from "../../../targeting/targeting-calculator.js";
import { CombatActionResourceChangeProperties } from "../../combat-action-resource-change-properties.js";
import { DAMAGING_ACTIONS_COMMON_CONFIG } from "../damaging-actions-common-config.js";

const config: CombatActionComponentConfig = {
  ...DAMAGING_ACTIONS_COMMON_CONFIG,
  ...NON_COMBATANT_INITIATED_ACTIONS_COMMON_CONFIG,
  description: "Deals kinetic fire damage in an area around the target",
  targetingSchemes: [TargetingScheme.Area],
  validTargetCategories: TargetCategories.Opponent,
  autoTargetSelectionMethod: {
    scheme: AutoTargetingScheme.BattleGroup,
    friendOrFoe: FriendOrFoe.Hostile,
  },
  usabilityContext: CombatActionUsabilityContext.InCombat,
  intent: CombatActionIntent.Malicious,
  prohibitedTargetCombatantStates: [
    ProhibitedTargetCombatantStates.UntargetableByPhysical,
    ProhibitedTargetCombatantStates.UntargetableBySpells,
    ProhibitedTargetCombatantStates.Dead,
  ],
  baseResourceChangeValuesLevelMultiplier: 1,
  accuracyModifier: 1,
  incursDurabilityLoss: {},
  costBases: {},
  userShouldMoveHomeOnComplete: false,
  getResourceCosts: () => null,
  requiresCombatTurn: () => true,
  shouldExecute: () => true,
  getActionStepAnimations: (context) => {
    const animations: CombatActionCombatantAnimations = {
      [CombatActionAnimationPhase.Delivery]: {
        name: { type: AnimationType.Dynamic, name: DynamicAnimationName.ExplosionDelivery },
        // timing: { type: AnimationTimingType.Timed, duration: 1200 },
        timing: { type: AnimationTimingType.Timed, duration: 200 },
      },
      [CombatActionAnimationPhase.RecoverySuccess]: {
        name: { type: AnimationType.Dynamic, name: DynamicAnimationName.ExplosionDissipation },
        // timing: { type: AnimationTimingType.Timed, duration: 700 },
        timing: { type: AnimationTimingType.Timed, duration: 200 },
      },
    };
    return animations;
  },
  getHpChangeProperties: (user) => {
    const hpChangeSourceConfig: ResourceChangeSourceConfig = {
      category: ResourceChangeSourceCategory.Physical,
      kineticDamageTypeOption: null,
      elementOption: MagicalElement.Fire,
      isHealing: false,
      lifestealPercentage: null,
    };

    const stacks = user.asUserOfTriggeredCondition?.stacksOption?.current || 1;

    console.log("stacks for exploison: ", stacks, "user level: ", user.level);
    const baseValues = new NumberRange(user.level * stacks, user.level * stacks * 10);

    const resourceChangeSource = new ResourceChangeSource(hpChangeSourceConfig);
    const hpChangeProperties: CombatActionResourceChangeProperties = {
      resourceChangeSource,
      baseValues,
    };

    console.log("explosion hp change range: ", baseValues);

    return hpChangeProperties;
  },

  getManaChangeProperties: () => null,
  getAppliedConditions: (context) => {
    // @TODO - apply a "burning" condition
    return null;
  },
  getChildren: (_user) => [],
  getParent: () => null,
  getRequiredRange: (_user, _self) => CombatActionRequiredRange.Ranged,
  getConcurrentSubActions(combatantContext) {
    return [];
  },
  getUnmodifiedAccuracy: function (user: CombatantProperties): ActionAccuracy {
    // @TODO - base off of activating condition spell level
    return { type: ActionAccuracyType.Unavoidable };
  },
  getCritChance: (user) => BASE_CRIT_CHANCE,
  getCritMultiplier: (user) => BASE_CRIT_MULTIPLIER,
  getArmorPenetration: (user, self) => 15,
  getResolutionSteps() {
    return [
      ActionResolutionStepType.OnActivationSpawnEntity,
      ActionResolutionStepType.OnActivationVfxMotion,
      ActionResolutionStepType.RollIncomingHitOutcomes,
      ActionResolutionStepType.EvalOnHitOutcomeTriggers,
      ActionResolutionStepType.VfxDisspationMotion,
    ];
  },
  motionPhasePositionGetters: {
    [ActionMotionPhase.Delivery]: (context) => {
      const { combatantContext, tracker } = context;
      const { actionExecutionIntent } = tracker;

      const targetingCalculator = new TargetingCalculator(combatantContext, null);
      const primaryTargetResult = targetingCalculator.getPrimaryTargetCombatant(
        combatantContext.party,
        actionExecutionIntent
      );
      if (primaryTargetResult instanceof Error) return primaryTargetResult;
      const target = primaryTargetResult;

      return { position: target.combatantProperties.homeLocation.clone() };
    },
  },

  getIsParryable: (user) => false,
  getIsBlockable: (user) => true,
  getCanTriggerCounterattack: (user) => false,

  getSpawnableEntity: (context) => {
    console.log(
      "getting spawnable entity",
      context.combatantContext.combatant.entityProperties.name
    );

    const { actionExecutionIntent } = context.tracker;
    const { party } = context.combatantContext;
    const targetingCalculator = new TargetingCalculator(context.combatantContext, null);
    const primaryTargetIdResult = targetingCalculator.getPrimaryTargetCombatant(
      party,
      actionExecutionIntent
    );
    if (primaryTargetIdResult instanceof Error) throw primaryTargetIdResult;

    const position = primaryTargetIdResult.combatantProperties.position;

    return {
      type: SpawnableEntityType.Vfx,
      vfx: {
        entityProperties: { id: context.idGenerator.generate(), name: "explosion" },
        vfxProperties: {
          vfxType: VfxType.Mobile,
          position,
          name: MobileVfxName.Explosion,
        },
      },
    };
  },
};

export const EXPLOSION = new CombatActionComposite(CombatActionName.Explosion, config);
