import {
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
import { CombatantContext } from "../../../../combatant-context/index.js";
import { NON_COMBATANT_INITIATED_ACTIONS_COMMON_CONFIG } from "../non-combatant-initiated-actions-common-config.js";
import { ActionResolutionStepType } from "../../../../action-processing/index.js";
import {
  HpChangeSource,
  HpChangeSourceCategory,
  HpChangeSourceConfig,
} from "../../../hp-change-source-types.js";
import { MagicalElement } from "../../../magical-elements.js";
import { NumberRange } from "../../../../primatives/number-range.js";
import { CombatActionHpChangeProperties } from "../../combat-action-hp-change-properties.js";
import { BASE_CRIT_CHANCE, BASE_CRIT_MULTIPLIER } from "../../../../app-consts.js";
import { SpawnableEntityType } from "../../../../spawnables/index.js";
import { MobileVfxName, VfxType } from "../../../../vfx/index.js";

const config: CombatActionComponentConfig = {
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
    ProhibitedTargetCombatantStates.Dead,
    ProhibitedTargetCombatantStates.UntargetableByPhysical,
    ProhibitedTargetCombatantStates.UntargetableBySpells,
  ],
  baseHpChangeValuesLevelMultiplier: 1,
  accuracyModifier: 1,
  incursDurabilityLoss: {},
  costBases: {},
  userShouldMoveHomeOnComplete: true,
  getResourceCosts: () => null,
  getExecutionTime: () => 300,
  requiresCombatTurn: () => true,
  shouldExecute: () => true,
  getCombatantUseAnimations: (combatantContext: CombatantContext) => null,
  getHpChangeProperties: () => {
    const hpChangeSourceConfig: HpChangeSourceConfig = {
      category: HpChangeSourceCategory.Physical,
      kineticDamageTypeOption: null,
      elementOption: MagicalElement.Fire,
      isHealing: false,
      lifestealPercentage: null,
    };

    const baseValues = new NumberRange(1, 1);

    const hpChangeSource = new HpChangeSource(hpChangeSourceConfig);
    const hpChangeProperties: CombatActionHpChangeProperties = {
      hpChangeSource,
      baseValues,
    };

    return hpChangeProperties;
  },
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
    return {
      type: ActionAccuracyType.Percentage,
      value: 100,
    };
  },
  getCritChance: (user) => BASE_CRIT_CHANCE,
  getCritMultiplier: (user) => BASE_CRIT_MULTIPLIER,
  getArmorPenetration: (user, self) => 15,
  getResolutionSteps() {
    return [
      ActionResolutionStepType.OnActivationSpawnEntity,
      ActionResolutionStepType.DeliveryMotion,
      ActionResolutionStepType.EvalOnUseTriggers,
      ActionResolutionStepType.RollIncomingHitOutcomes,
      ActionResolutionStepType.EvalOnHitOutcomeTriggers,
      ActionResolutionStepType.RecoveryMotion,
    ];
  },
  motionPhasePositionGetters: {},

  getIsParryable: (user) => false,
  getIsBlockable: (user) => true,
  getCanTriggerCounterattack: (user) => false,

  getSpawnableEntity: (context) => {
    const { combatantContext, tracker } = context;
    const previousTrackerOption = tracker.getPreviousTrackerInSequenceOption();
    let position = combatantContext.combatant.combatantProperties.position.clone();
    if (
      previousTrackerOption &&
      previousTrackerOption.spawnedEntityOption &&
      previousTrackerOption.spawnedEntityOption.type === SpawnableEntityType.Vfx
    ) {
      position = previousTrackerOption.spawnedEntityOption.vfx.vfxProperties.position.clone();
    }
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
