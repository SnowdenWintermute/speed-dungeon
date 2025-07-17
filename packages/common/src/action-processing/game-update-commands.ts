import { Quaternion, Vector3 } from "@babylonjs/core";
import { ConditionId, EntityId, Milliseconds } from "../primatives/index.js";
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
import {
  SceneEntityChildTransformNodeIdentifier,
  SceneEntityChildTransformNodeIdentifierWithDuration,
} from "../scene-entities/index.js";
import {
  CosmeticEffectOnEntity,
  CosmeticEffectOnTargetTransformNode,
  EquipmentAnimation,
} from "../combat/combat-actions/combat-action-steps-config.js";

export enum GameUpdateCommandType {
  SpawnEntity,
  CombatantMotion,
  ActionEntityMotion,
  ResourcesPaid,
  ActivatedTriggers,
  HitOutcomes,
  ActionCompletion,
}

export const GAME_UPDATE_COMMAND_TYPE_STRINGS: Record<GameUpdateCommandType, string> = {
  [GameUpdateCommandType.SpawnEntity]: "Spawn Entity",
  [GameUpdateCommandType.CombatantMotion]: "Entity Motion",
  [GameUpdateCommandType.ActionEntityMotion]: "Entity Motion",
  [GameUpdateCommandType.ResourcesPaid]: "Resources Paid",
  [GameUpdateCommandType.ActivatedTriggers]: "Activated Triggers",
  [GameUpdateCommandType.HitOutcomes]: "Hit Outcomes",
  [GameUpdateCommandType.ActionCompletion]: "Action Completion",
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
export type EntityAnimation = {
  name: TaggedAnimationName;
  timing: AnimationTiming;
  smoothTransition: boolean;
};

export interface SpawnEntityGameUpdateCommand extends IGameUpdateCommand {
  type: GameUpdateCommandType.SpawnEntity;
  entity: SpawnableEntity;
}

export interface IEntityMotionUpdate {
  // @PERF - could rely on the main update command entityId and only supply this if the motion update is for another entity
  // such as when a combatant motion update has to tell a projectile to point somewhere or change its parent
  entityId: EntityId;
  animationOption?: EntityAnimation;
  translationOption?: EntityTranslation;
  rotationOption?: EntityRotation;
}

export interface TargetCombatantChildTransformNodeWithDuration {
  target: SceneEntityChildTransformNodeIdentifier;
  duration: Milliseconds;
}

export interface ActionEntityMotionUpdate extends IEntityMotionUpdate {
  entityType: SpawnableEntityType.ActionEntity;
  cosmeticDestinationY?: SceneEntityChildTransformNodeIdentifier;
  despawn?: boolean;
  despawnOnComplete?: boolean;
  setParent?: SceneEntityChildTransformNodeIdentifierWithDuration | null;
  lockRotationToFace?: SceneEntityChildTransformNodeIdentifierWithDuration | null;
  startPointingToward?: SceneEntityChildTransformNodeIdentifierWithDuration | null;
}

export interface CombatantMotionUpdate extends IEntityMotionUpdate {
  entityType: SpawnableEntityType.Combatant;
  idleOnComplete?: boolean;
  equipmentAnimations?: EquipmentAnimation[];
}

export type EntityMotionUpdate = CombatantMotionUpdate | ActionEntityMotionUpdate;

export interface IGameUpdateCommand {
  actionName: CombatActionName;
  step: ActionResolutionStepType;
  completionOrderId: null | number;
  cosmeticEffectsToStart?: CosmeticEffectOnTargetTransformNode[];
  cosmeticEffectsToStop?: CosmeticEffectOnEntity[];
}

export interface CombatantMotionGameUpdateCommand extends IGameUpdateCommand {
  type: GameUpdateCommandType.CombatantMotion;
  mainEntityUpdate: CombatantMotionUpdate;
  auxiliaryUpdates?: EntityMotionUpdate[];
}

export interface ActionEntityMotionGameUpdateCommand extends IGameUpdateCommand {
  type: GameUpdateCommandType.ActionEntityMotion;
  mainEntityUpdate: ActionEntityMotionUpdate;
  auxiliaryUpdates?: EntityMotionUpdate[];
}

export type EntityMotionUpdateCommand =
  | CombatantMotionGameUpdateCommand
  | ActionEntityMotionGameUpdateCommand;

export interface ResourcesPaidGameUpdateCommand extends IGameUpdateCommand {
  type: GameUpdateCommandType.ResourcesPaid;
  combatantId: EntityId;
  costsPaid?: ActionResourceCosts;
  itemsConsumed?: [EntityId];
}

export interface ActivatedTriggersGameUpdateCommand extends IGameUpdateCommand {
  type: GameUpdateCommandType.ActivatedTriggers;
  durabilityChanges?: DurabilityChangesByEntityId;
  hitPointChanges?: HitPointChanges;
  appliedConditions?: Partial<Record<HitOutcome, Record<EntityId, CombatantCondition[]>>>;
  removedConditionStacks?: Record<EntityId, { conditionId: EntityId; numStacks: number }[]>;
  removedConditionIds?: Record<EntityId, ConditionId[]>;
}

export interface HitOutcomesGameUpdateCommand extends IGameUpdateCommand {
  type: GameUpdateCommandType.HitOutcomes;
  actionUserName: string;
  actionUserId: string;
  outcomes: CombatActionHitOutcomes;
}

export interface ActionCompletionUpdateCommand extends IGameUpdateCommand {
  type: GameUpdateCommandType.ActionCompletion;
  unlockInput?: boolean;
  endActiveCombatantTurn?: boolean;
}

export type GameUpdateCommand =
  | SpawnEntityGameUpdateCommand
  | CombatantMotionGameUpdateCommand
  | ActionEntityMotionGameUpdateCommand
  | ResourcesPaidGameUpdateCommand
  | ActivatedTriggersGameUpdateCommand
  | HitOutcomesGameUpdateCommand
  | ActionCompletionUpdateCommand;
