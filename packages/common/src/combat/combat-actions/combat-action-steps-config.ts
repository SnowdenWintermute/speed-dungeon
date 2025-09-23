import { Vector3 } from "@babylonjs/core";
import { CosmeticEffectNames } from "../../action-entities/cosmetic-effect.js";
import {
  ActionResolutionStepContext,
  ActionResolutionStepType,
  EntityAnimation,
  EntityDestination,
  EntityMotionUpdate,
} from "../../action-processing/index.js";
import { CombatantSpecies } from "../../combatants/combatant-species.js";
import { TaggedEquipmentSlot } from "../../items/equipment/slots.js";
import { Milliseconds } from "../../primatives/index.js";
import {
  SceneEntityChildTransformNodeIdentifier,
  SceneEntityChildTransformNodeIdentifierWithDuration,
} from "../../scene-entities/index.js";
import { SpawnableEntity } from "../../spawnables/index.js";
import { iterateNumericEnumKeyedRecord } from "../../utils/index.js";
import { MeleeAttackAnimationType } from "./action-implementations/attack/determine-melee-attack-animation-type.js";
import { CleanupMode } from "../../types.js";
import { IActionUser } from "../../combatant-context/action-user.js";

export interface EquipmentAnimation {
  slot: TaggedEquipmentSlot;
  animation: EntityAnimation;
}

export interface CosmeticEffectOnTargetTransformNode {
  name: CosmeticEffectNames;
  parent: SceneEntityChildTransformNodeIdentifier;
  unattached?: boolean;
  offsetOption?: Vector3;
  rankOption?: number;
  lifetime?: Milliseconds;
}

export interface ActionResolutionStepConfig {
  getCosmeticEffectsToStart?(
    context: ActionResolutionStepContext
  ): CosmeticEffectOnTargetTransformNode[];
  getCosmeticEffectsToStop?(
    context: ActionResolutionStepContext
  ): CosmeticEffectOnTargetTransformNode[];
  getAnimation?(
    user: IActionUser,
    animationLengths: Record<CombatantSpecies, Record<string, Milliseconds>>,
    meleeAttackAnimationType?: MeleeAttackAnimationType,
    successOption?: boolean
  ): EntityAnimation;
  /** Firewall burn is using this to schedule a perfectly timed burning effect when a combatant walks over the firewall */
  getDelay?(externallySetDelayOption?: Milliseconds): Milliseconds;
  getDestination?(context: ActionResolutionStepContext): Error | null | EntityDestination;
  // @PERF - client could probably figure this out on their own or with more limited info
  // from server
  getDespawnOnCompleteCleanupModeOption?: (context: ActionResolutionStepContext) => CleanupMode;
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
    user: IActionUser,
    animationLengths: Record<CombatantSpecies, Record<string, Milliseconds>>
  ): EquipmentAnimation[];
  //an arrow to have been spawned
  getSpawnableEntity?: (context: ActionResolutionStepContext) => null | SpawnableEntity;
  getAuxiliaryEntityMotions?(context: ActionResolutionStepContext): EntityMotionUpdate[];

  shouldIdleOnComplete?: boolean;
}

export interface ActionResolutionStepsConfigOptions {
  getFinalSteps: (
    self: ActionResolutionStepsConfig,
    context: ActionResolutionStepContext
  ) => Partial<Record<ActionResolutionStepType, ActionResolutionStepConfig>>;
}

export class ActionResolutionStepsConfig {
  constructor(
    public steps: Partial<Record<ActionResolutionStepType, ActionResolutionStepConfig>>,
    public finalSteps: Partial<Record<ActionResolutionStepType, ActionResolutionStepConfig>>,
    // some actions may or may not be the last action in a chain, such as main hand
    // attack while wielding an offhand. In this case we can't difinitively say that
    // user will always return home after such an action, but we can say if they
    // should return home if it is the last action in the chain and dynamically
    // add the step
    public options: ActionResolutionStepsConfigOptions
  ) {}
  getStepTypes() {
    const stepTypes = iterateNumericEnumKeyedRecord(this.steps)
      .sort(([aKey, aValue], [bKey, bValue]) => aKey - bKey)
      .map(([key, value]) => key);
    return stepTypes;
  }

  getStepConfigOption(stepType: ActionResolutionStepType) {
    const mainStepOption = this.steps[stepType];
    const finalStepOption = this.finalSteps[stepType];
    return mainStepOption || finalStepOption;
  }
}
