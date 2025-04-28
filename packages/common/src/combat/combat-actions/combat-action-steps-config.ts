import { CosmeticEffectNames } from "../../action-entities/cosmetic-effect.js";
import { AbstractParentType } from "../../action-entities/index.js";
import {
  ActionResolutionStepContext,
  ActionResolutionStepType,
  EntityAnimation,
} from "../../action-processing/index.js";
import { Milliseconds } from "../../primatives/index.js";
import { SpawnableEntity } from "../../spawnables/index.js";
import { iterateNumericEnumKeyedRecord } from "../../utils/index.js";
import { KineticDamageType } from "../kinetic-damage-types.js";
import { CombatActionCombatantAnimations } from "./combat-action-animations.js";

export interface ActionResolutionStepConfig {
  cosmeticsEffectsToStart?: {
    name: CosmeticEffectNames;
    parentType: AbstractParentType;
    lifetime?: Milliseconds;
  }[];
  cosmeticsEffectsToStop?: CosmeticEffectNames[];
  getAnimation?(
    successOption?: boolean,
    kineticDamageIntentOption?: KineticDamageType
  ): EntityAnimation;
}

export class CombatActionStepConfigs {
  constructor(
    public steps: Partial<Record<ActionResolutionStepType, ActionResolutionStepConfig>>,
    public userShouldMoveHomeOnComplete: boolean
  ) {}
  getStepTypes() {
    const stepTypes = iterateNumericEnumKeyedRecord(this.steps).map(([key, value]) => key);
    return stepTypes;
  }
}

// animations by step
// - kinetic type intent
// - blocked or parried

export interface CombatActionStepsConfig {
  // some actions may or may not be the last action in a chain, such as main hand
  // attack while wielding an offhand. In this case we can't difinitively say that
  // user will always return home after such an action, but we can say if they
  // should return home if it is the last action in the chain and dynamically
  // add the step
  userShouldMoveHomeOnComplete: boolean;
  getResolutionSteps: () => ActionResolutionStepType[];
  steps: Partial<Record<ActionResolutionStepType, {}>>;
  getActionStepAnimations: (
    context: ActionResolutionStepContext
  ) => null | Error | CombatActionCombatantAnimations;
  getCosmeticEffectToStartByStep?: () => Partial<
    Record<
      ActionResolutionStepType,
      { name: CosmeticEffectNames; parentType: AbstractParentType; lifetime?: Milliseconds }[]
    >
  >;
  getCosmeticEffectToStopByStep?: () => Partial<
    Record<ActionResolutionStepType, CosmeticEffectNames[]>
  >;
  getSpawnableEntity?: (context: ActionResolutionStepContext) => SpawnableEntity;
}
