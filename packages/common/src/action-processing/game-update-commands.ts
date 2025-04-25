import { Quaternion, Vector3 } from "@babylonjs/core";
import { EntityId, Milliseconds } from "../primatives/index.js";
import {
  ActionResourceCosts,
  CombatActionHitOutcomes,
  CombatActionName,
  HitPointChanges,
} from "../combat/index.js";
import { TaggedAnimationName } from "../app-consts.js";
import { ActionResolutionStepType } from "./action-steps/index.js";
import { Combatant, CombatantCondition } from "../combatants/index.js";
import { SpawnableEntity, SpawnableEntityType } from "../spawnables/index.js";
import { DurabilityChangesByEntityId } from "../durability/index.js";
import { HitOutcome } from "../hit-outcome.js";
import { ActionEntity } from "../action-entities/index.js";

export enum GameUpdateCommandType {
  SpawnEntity,
  EntityMotion,
  ResourcesPaid,
  ActivatedTriggers,
  HitOutcomes,
}

// UPDATE TYPES
// hit outcomes
// resources paid
// activated triggers
// spawn vfx entity
// entity motion (vfx or combatant)
// - animation
// - animation is repeating
// - destinationOption
// - translation duration
//
//
// RANGED ATTACK
// - entity motion: user, move forward, Vec3(in front of user)
// - resources paid
// - activated triggers
// - spawn vfx: arrow, Vec3(knocked)
// - entity motion: user, bow pull to release, NULL
//   - entity motion: arrow, NULL, Vec3(target location)
//   - hit outcomes
//   - activated triggers
// - entity motion: user, move back, Vec3(home location)

export const GAME_UPDATE_COMMAND_TYPE_STRINGS: Record<GameUpdateCommandType, string> = {
  [GameUpdateCommandType.SpawnEntity]: "Spawn Entity",
  [GameUpdateCommandType.EntityMotion]: "Entity Motion",
  [GameUpdateCommandType.ResourcesPaid]: "Resources Paid",
  [GameUpdateCommandType.ActivatedTriggers]: "Activated Triggers",
  [GameUpdateCommandType.HitOutcomes]: "Hit Outcomes",
};

export type GameEntity = Combatant | ActionEntity;
export interface EntityTranslation {
  duration: Milliseconds;
  destination: Vector3;
}
export interface EntityRotation {
  duration: Milliseconds;
  rotation: Quaternion;
}
export interface EntityDestination {
  position?: Vector3;
  rotation?: Quaternion;
}
export enum AnimationTimingType {
  Timed,
  Looping,
}
export type LoopingAnimation = { type: AnimationTimingType.Looping };
export type TimedAnimation = { type: AnimationTimingType.Timed; duration: Milliseconds };
export type AnimationTiming = LoopingAnimation | TimedAnimation;
export type EntityAnimation = { name: TaggedAnimationName; timing: AnimationTiming };

export type SpawnEntityGameUpdateCommand = {
  type: GameUpdateCommandType.SpawnEntity;
  step: ActionResolutionStepType;
  completionOrderId: null | number;
  entity: SpawnableEntity;
};

export type EntityMotionGameUpdateCommand = {
  type: GameUpdateCommandType.EntityMotion;
  completionOrderId: null | number;
  step: ActionResolutionStepType;
  actionName: CombatActionName;
  entityType: SpawnableEntityType;
  entityId: EntityId;
  animationOption?: EntityAnimation;
  translationOption?: EntityTranslation;
  rotationOption?: EntityRotation;
  idleOnComplete?: boolean;
  instantTransition?: boolean;
  despawnOnComplete?: boolean;
};

export type ResourcesPaidGameUpdateCommand = {
  type: GameUpdateCommandType.ResourcesPaid;
  step: ActionResolutionStepType;
  actionName: CombatActionName;
  completionOrderId: null | number;
  combatantId: EntityId;
  costsPaid?: ActionResourceCosts;
  itemsConsumed?: [EntityId];
};

export type ActivatedTriggersGameUpdateCommand = {
  type: GameUpdateCommandType.ActivatedTriggers;
  step: ActionResolutionStepType;
  actionName: CombatActionName;
  completionOrderId: null | number;
  durabilityChanges?: DurabilityChangesByEntityId;
  hitPointChanges?: HitPointChanges;
  appliedConditions?: Partial<Record<HitOutcome, Record<EntityId, CombatantCondition[]>>>;
  removedConditionStacks?: Record<EntityId, { conditionId: EntityId; numStacks: number }[]>;
};

export type HitOutcomesGameUpdateCommand = {
  type: GameUpdateCommandType.HitOutcomes;
  step: ActionResolutionStepType;
  actionName: CombatActionName;
  completionOrderId: null | number;
  actionUserName: string;
  actionUserId: string;
  outcomes: CombatActionHitOutcomes;
};

export type GameUpdateCommand =
  | SpawnEntityGameUpdateCommand
  | EntityMotionGameUpdateCommand
  | ResourcesPaidGameUpdateCommand
  | ActivatedTriggersGameUpdateCommand
  | HitOutcomesGameUpdateCommand;
