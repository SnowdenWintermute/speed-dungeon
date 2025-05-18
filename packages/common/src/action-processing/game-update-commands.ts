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
import {
  ActionEntity,
  SceneEntityChildTransformNodeIdentifier,
  SceneEntityChildTransformNodeIdentifierWithDuration,
} from "../action-entities/index.js";
import { EquipmentAnimation } from "../combat/combat-actions/combat-action-steps-config.js";

export enum GameUpdateCommandType {
  SpawnEntity,
  CombatantMotion,
  ActionEntityMotion,
  ResourcesPaid,
  ActivatedTriggers,
  HitOutcomes,
}

export const GAME_UPDATE_COMMAND_TYPE_STRINGS: Record<GameUpdateCommandType, string> = {
  [GameUpdateCommandType.SpawnEntity]: "Spawn Entity",
  [GameUpdateCommandType.CombatantMotion]: "Entity Motion",
  [GameUpdateCommandType.ActionEntityMotion]: "Entity Motion",
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

export interface IEntityMotionUpdate {
  // @PERF - could rely on the main update command entityId and only supply this if the motion update is for another entity
  // such as when a combatant motion update has to tell a projectile to point somewhere or change its parent
  entityId: EntityId;
  animationOption?: EntityAnimation;
  translationOption?: EntityTranslation;
  rotationOption?: EntityRotation;
  instantTransition?: boolean;
}

export interface TargetCombatantChildTransformNodeWithDuration {
  target: SceneEntityChildTransformNodeIdentifier;
  duration: Milliseconds;
}

export interface ActionEntityMotionUpdate extends IEntityMotionUpdate {
  entityType: SpawnableEntityType.ActionEntity;
  despawnOnComplete?: boolean;
  setParent?: SceneEntityChildTransformNodeIdentifierWithDuration | null;
  cosmeticDestinationY?: SceneEntityChildTransformNodeIdentifier;
  startPointingTowardEntityOption?: SceneEntityChildTransformNodeIdentifierWithDuration;
}

export interface CombatantMotionUpdate extends IEntityMotionUpdate {
  entityType: SpawnableEntityType.Combatant;
  idleOnComplete?: boolean;
  equipmentAnimations?: EquipmentAnimation[];
}

export type EntityMotionUpdate = CombatantMotionUpdate | ActionEntityMotionUpdate;

export type CombatantMotionGameUpdateCommand = {
  type: GameUpdateCommandType.CombatantMotion;
  completionOrderId: null | number;

  step: ActionResolutionStepType;
  actionName: CombatActionName; // so client can look up the cosmetic effects associated with it

  mainEntityUpdate: CombatantMotionUpdate;
  auxiliaryUpdates?: EntityMotionUpdate[];
};

export type ActionEntityMotionGameUpdateCommand = {
  type: GameUpdateCommandType.ActionEntityMotion;
  completionOrderId: null | number;

  step: ActionResolutionStepType;
  actionName: CombatActionName; // so client can look up the cosmetic effects associated with it

  mainEntityUpdate: ActionEntityMotionUpdate;
  auxiliaryUpdates?: EntityMotionUpdate[];
};

export type EntityMotionUpdateCommand =
  | CombatantMotionGameUpdateCommand
  | ActionEntityMotionGameUpdateCommand;

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
  | CombatantMotionGameUpdateCommand
  | ActionEntityMotionGameUpdateCommand
  | ResourcesPaidGameUpdateCommand
  | ActivatedTriggersGameUpdateCommand
  | HitOutcomesGameUpdateCommand;
