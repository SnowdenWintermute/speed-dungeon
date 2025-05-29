import { CosmeticEffectNames } from "../../action-entities/cosmetic-effect.js";
import {
  ActionResolutionStepContext,
  ActionResolutionStepType,
  EntityAnimation,
  EntityDestination,
  EntityMotionUpdate,
} from "../../action-processing/index.js";
import { CombatantSpecies } from "../../combatants/combatant-species.js";
import { CombatantProperties } from "../../combatants/index.js";
import { TaggedEquipmentSlot } from "../../items/equipment/slots.js";
import { Milliseconds } from "../../primatives/index.js";
import {
  SceneEntityChildTransformNodeIdentifier,
  SceneEntityChildTransformNodeIdentifierWithDuration,
  SceneEntityIdentifier,
} from "../../scene-entities/index.js";
import { iterateNumericEnumKeyedRecord } from "../../utils/index.js";
import { MeleeAttackAnimationType } from "./action-implementations/attack/determine-melee-attack-animation-type.js";

export interface EquipmentAnimation {
  slot: TaggedEquipmentSlot;
  animation: EntityAnimation;
}

export interface CosmeticEffectOnTargetTransformNode {
  name: CosmeticEffectNames;
  parent: SceneEntityChildTransformNodeIdentifier;
  lifetime?: Milliseconds;
}
export interface CosmeticEffectOnEntity {
  name: CosmeticEffectNames;
  sceneEntityIdentifier: SceneEntityIdentifier;
}

export interface ActionResolutionStepConfig {
  getCosmeticsEffectsToStart?(
    context: ActionResolutionStepContext
  ): CosmeticEffectOnTargetTransformNode[];
  getCosmeticsEffectsToStop?(context: ActionResolutionStepContext): CosmeticEffectOnEntity[];
  getAnimation?(
    user: CombatantProperties,
    animationLengths: Record<CombatantSpecies, Record<string, Milliseconds>>,
    meleeAttackAnimationType?: MeleeAttackAnimationType,
    successOption?: boolean
  ): EntityAnimation;
  getDestination?(context: ActionResolutionStepContext): Error | EntityDestination;
  // @PERF - client could probably figure this out on their own or with more limited info
  // from server
  shouldDespawnOnComplete?: (context: ActionResolutionStepContext) => boolean;
  getNewParent?: (
    context: ActionResolutionStepContext
  ) => SceneEntityChildTransformNodeIdentifierWithDuration | null;
  getCosmeticDestinationY?: (
    context: ActionResolutionStepContext
  ) => SceneEntityChildTransformNodeIdentifier;
  getEntityToLockOnTo?: (
    context: ActionResolutionStepContext
  ) => SceneEntityChildTransformNodeIdentifierWithDuration | null;
  getStartPointingToward?: (
    context: ActionResolutionStepContext
  ) => SceneEntityChildTransformNodeIdentifierWithDuration;
  getEquipmentAnimations?(
    user: CombatantProperties,
    animationLengths: Record<CombatantSpecies, Record<string, Milliseconds>>
  ): EquipmentAnimation[];
  //

  getAuxiliaryEntityMotions?(context: ActionResolutionStepContext): EntityMotionUpdate[];

  // don't include this step in the initial list, it may be added later such as in the case
  // of return home step for a melee main hand attack that killed its target, thus not needing
  // to do the offhand attack
  isConditionalStep?: boolean;
}

export class ActionResolutionStepsConfig {
  constructor(
    public steps: Partial<Record<ActionResolutionStepType, ActionResolutionStepConfig>>,
    // some actions may or may not be the last action in a chain, such as main hand
    // attack while wielding an offhand. In this case we can't difinitively say that
    // user will always return home after such an action, but we can say if they
    // should return home if it is the last action in the chain and dynamically
    // add the step
    public options: { userShouldMoveHomeOnComplete?: boolean }
  ) {}
  getStepTypes() {
    const stepTypes = iterateNumericEnumKeyedRecord(this.steps)
      .sort(([aKey, aValue], [bKey, bValue]) => aKey - bKey)
      .filter(([key, value]) => !value.isConditionalStep)
      .map(([key, value]) => key);
    return stepTypes;
  }
}
