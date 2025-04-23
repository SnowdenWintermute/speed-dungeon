import {
  CombatActionComponent,
  CombatActionComponentConfig,
  CombatActionComposite,
  CombatActionName,
  CombatActionUsabilityContext,
  TargetCategories,
  TargetingScheme,
} from "../../index.js";
import { RANGED_ACTIONS_COMMON_CONFIG } from "../ranged-actions-common-config.js";
import { AutoTargetingScheme } from "../../../targeting/index.js";
import { CombatActionIntent } from "../../combat-action-intent.js";
import { ProhibitedTargetCombatantStates } from "../../prohibited-target-combatant-states.js";
import { ICE_BOLT_PARENT } from "./index.js";
import { CombatActionRequiredRange } from "../../combat-action-range.js";
import { ERROR_MESSAGES } from "../../../../errors/index.js";
import {
  ActionMotionPhase,
  ActionResolutionStepType,
} from "../../../../action-processing/index.js";
import { TargetingCalculator } from "../../../targeting/targeting-calculator.js";
import { SpawnableEntityType } from "../../../../spawnables/index.js";
import {
  ClientOnlyVfxNames,
  MobileVfxName,
  VfxParentType,
  VfxType,
} from "../../../../vfx/index.js";
import { PrimedForIceBurstCombatantCondition } from "../../../../combatants/combatant-conditions/primed-for-ice-burst.js";
import { DAMAGING_ACTIONS_COMMON_CONFIG } from "../damaging-actions-common-config.js";

const config: CombatActionComponentConfig = {
  ...DAMAGING_ACTIONS_COMMON_CONFIG,
  ...RANGED_ACTIONS_COMMON_CONFIG,
  description: "An icy projectile",
  targetingSchemes: [TargetingScheme.Single],
  validTargetCategories: TargetCategories.Opponent,
  autoTargetSelectionMethod: { scheme: AutoTargetingScheme.CopyParent },
  usabilityContext: CombatActionUsabilityContext.InCombat,
  intent: CombatActionIntent.Malicious,
  prohibitedTargetCombatantStates: [
    ProhibitedTargetCombatantStates.Dead,
    ProhibitedTargetCombatantStates.UntargetableByPhysical,
    ProhibitedTargetCombatantStates.UntargetableBySpells,
  ],
  prohibitedHitCombatantStates: [],
  accuracyModifier: 0.9,
  incursDurabilityLoss: {},
  costBases: {},
  userShouldMoveHomeOnComplete: false,
  getResourceCosts: () => null,
  requiresCombatTurn: () => true,
  getActionStepAnimations: (context) => null,
  getHpChangeProperties: (user, primaryTarget, self) =>
    ICE_BOLT_PARENT.getHpChangeProperties(user, primaryTarget),
  getChildren: (context) => [],
  getParent: () => ICE_BOLT_PARENT,
  getRequiredRange: (_user, _self) => CombatActionRequiredRange.Ranged,
  getConcurrentSubActions() {
    return [];
  },
  getAutoTarget(combatantContext, previousTrackerOption, self) {
    if (!previousTrackerOption)
      return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.MISSING_EXPECTED_ACTION_IN_CHAIN);

    return previousTrackerOption.actionExecutionIntent.targets;
  },

  getSpawnableEntity: (context) => {
    const { combatantContext } = context;
    const { actionExecutionIntent } = context.tracker;
    const { party } = combatantContext;
    const position = combatantContext.combatant.combatantProperties.position.clone();

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
          name: MobileVfxName.IceBolt,
          parentOption: {
            type: VfxParentType.UserOffHand,
            parentEntityId: context.combatantContext.combatant.entityProperties.id,
          },
          pointTowardEntityOption: target.entityProperties.id,
        },
      },
    };
  },

  getClientOnlyVfxToStartByStep() {
    return {
      [ActionResolutionStepType.OnActivationVfxMotion]: [
        {
          name: ClientOnlyVfxNames.FrostParticleStream,
          parentType: VfxParentType.VfxEntityRoot,
        },
      ],
      [ActionResolutionStepType.RollIncomingHitOutcomes]: [
        {
          name: ClientOnlyVfxNames.FrostParticleBurst,
          parentType: VfxParentType.CombatantHitboxCenter,
          lifetime: 300,
        },
      ],
    };
  },
  // getClientOnlyVfxToStopByStep(context) {
  //   return {
  //     [ActionResolutionStepType.RollIncomingHitOutcomes]: [ClientOnlyVfxNames.FrostParticleStream],
  //   };
  // },
  getResolutionSteps() {
    return [
      ActionResolutionStepType.OnActivationSpawnEntity,
      ActionResolutionStepType.OnActivationVfxMotion,
      ActionResolutionStepType.RollIncomingHitOutcomes,
      ActionResolutionStepType.EvalOnHitOutcomeTriggers,
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

  getAppliedConditions: (context) => {
    const { idGenerator, combatantContext } = context;
    const { combatant } = combatantContext;

    const condition = new PrimedForIceBurstCombatantCondition(
      idGenerator.generate(),
      combatant.entityProperties.id,
      combatant.combatantProperties.level
    );

    return [condition];
  },

  getCritChance: (user) => ICE_BOLT_PARENT.getCritChance(user),
};

export const ICE_BOLT_PROJECTILE = new CombatActionComposite(
  CombatActionName.IceBoltProjectile,
  config
);
