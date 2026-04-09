import { Quaternion, Vector3 } from "@babylonjs/core";
import { CombatantId, EntityId, Milliseconds, PartyName } from "../aliases.js";
import { TaggedAnimationName } from "../app-consts.js";
import { ActionResolutionStepType } from "./action-steps/index.js";
import { Combatant } from "../combatants/index.js";
import { SerializedSpawnableEntity, SpawnableEntityType } from "../spawnables/index.js";
import { DurabilityChangesByEntityId } from "../durability/index.js";
import { HitOutcome } from "../hit-outcome.js";
import { ActionEntity, ActionEntityActionOriginData } from "../action-entities/index.js";
import {
  SceneEntityChildTransformNodeIdentifier,
  SceneEntityChildTransformNodeIdentifierWithDuration,
} from "../scene-entities/index.js";
import {
  CosmeticEffectOnTargetTransformNode,
  EquipmentAnimation,
} from "../combat/combat-actions/combat-action-steps-config.js";
import { CleanupMode } from "../types.js";
import { PetSlot } from "../combat/combat-actions/action-implementations/generic-action-templates/pets.js";
import { CombatantCondition } from "../conditions/index.js";
import { CurveType } from "../utils/interpolation-curves.js";
import { CombatActionName } from "../combat/combat-actions/combat-action-names.js";
import { ActionResourceCosts } from "../combat/combat-actions/action-calculation-utils/action-costs.js";
import {
  HitPointChanges,
  ThreatChanges,
} from "../combat/action-results/action-hit-outcome-calculation/resource-changes.js";
import { CombatantClass } from "../combatants/combatant-class/classes.js";
import { CombatActionHitOutcomes } from "../combat/action-results/action-hit-outcome-calculation/index.js";
import { ActionUseMessageData } from "../combat/combat-actions/combat-action-combat-log-properties.js";
import { SerializedOf } from "../serialization/index.js";
import { BattleConclusion } from "../battle/index.js";
import { Equipment } from "../items/equipment/index.js";
import { Consumable } from "../items/consumables/index.js";

export enum GameUpdateCommandType {
  SpawnEntities,
  CombatantMotion,
  ActionEntityMotion,
  ResourcesPaid,
  ActionUseGameLogMessage,
  ActionResolutionGameLogMessage,
  ActivatedTriggers,
  HitOutcomes,
  ActionCompletion,
  BattleConclusion,
}

export const GAME_UPDATE_COMMAND_TYPE_STRINGS: Record<GameUpdateCommandType, string> = {
  [GameUpdateCommandType.SpawnEntities]: "Spawn Entities",
  [GameUpdateCommandType.CombatantMotion]: "Combatant Entity Motion",
  [GameUpdateCommandType.ActionEntityMotion]: "Combatant Entity Motion",
  [GameUpdateCommandType.ResourcesPaid]: "Resources Paid",
  [GameUpdateCommandType.ActionUseGameLogMessage]: "Action Use Game Log Message",
  [GameUpdateCommandType.ActivatedTriggers]: "Activated Triggers",
  [GameUpdateCommandType.HitOutcomes]: "Hit Outcomes",
  [GameUpdateCommandType.ActionCompletion]: "Action Completion",
  [GameUpdateCommandType.ActionResolutionGameLogMessage]: "Action Resolution Game Log Message",
  [GameUpdateCommandType.BattleConclusion]: "Battle Conclusion",
};

export type GameEntity = Combatant | ActionEntity;

export interface EntityTranslation {
  duration: Milliseconds;
  destination: Vector3;
  translationPathCurveOption?: CurveType;
  translationSpeedCurveOption?: CurveType;
  setAsNewHome?: boolean;
}
export interface EntityRotation {
  duration: Milliseconds;
  rotation: Quaternion;
}

export interface EntityDestination {
  position?: Vector3;
  translationPathCurveOption?: CurveType;
  translationSpeedCurveOption?: CurveType;
  rotation?: Quaternion;
  setAsNewHome?: boolean;
}

export enum AnimationTimingType {
  Timed,
  Looping,
}
export interface LoopingAnimation {
  type: AnimationTimingType.Looping;
}
export interface TimedAnimation {
  type: AnimationTimingType.Timed;
  duration: Milliseconds;
}
export type AnimationTiming = LoopingAnimation | TimedAnimation;
export interface EntityAnimation {
  name: TaggedAnimationName;
  timing: AnimationTiming;
  smoothTransition: boolean;
}

export interface SpawnEntitiesGameUpdateCommand extends IGameUpdateCommand {
  type: GameUpdateCommandType.SpawnEntities;
  entities: SerializedSpawnableEntity[];
}

export interface IEntityMotionUpdate {
  // @PERF - could rely on the main update command entityId and only supply this if the motion update is for another entity
  // such as when a combatant motion update has to tell a projectile to point somewhere or change its parent
  entityId: EntityId;
  entityType: SpawnableEntityType;
  animationOption?: EntityAnimation;
  translationOption?: EntityTranslation;
  rotationOption?: EntityRotation;
  delayOption?: Milliseconds;
}

export interface TargetCombatantChildTransformNodeWithDuration {
  target: SceneEntityChildTransformNodeIdentifier;
  duration: Milliseconds;
}

export interface ActionEntityMotionUpdate extends IEntityMotionUpdate {
  entityType: SpawnableEntityType.ActionEntity;
  despawnOnCompleteMode?: CleanupMode;
  cosmeticDestinationY?: SceneEntityChildTransformNodeIdentifier;
  setParent?: SceneEntityChildTransformNodeIdentifierWithDuration | null;
  lockRotationToFace?: SceneEntityChildTransformNodeIdentifierWithDuration | null;
  startPointingToward?: SceneEntityChildTransformNodeIdentifierWithDuration | null;
}

export interface CombatantMotionUpdate extends IEntityMotionUpdate {
  entityType: SpawnableEntityType.Combatant;
  idleOnComplete?: boolean;
  setParent?: SceneEntityChildTransformNodeIdentifierWithDuration | null;
  equipmentAnimations?: EquipmentAnimation[];
}

export type EntityMotionUpdate = CombatantMotionUpdate | ActionEntityMotionUpdate;

export interface IGameUpdateCommand {
  actionName: CombatActionName;
  step: ActionResolutionStepType;
  completionOrderId: null | number;
  cosmeticEffectsToStart?: CosmeticEffectOnTargetTransformNode[];
  cosmeticEffectsToStop?: CosmeticEffectOnTargetTransformNode[];
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
  cooldownSet?: number;
  itemsConsumed?: [EntityId];
}

export interface ActivatedTriggersGameUpdateCommand extends IGameUpdateCommand {
  type: GameUpdateCommandType.ActivatedTriggers;
  actionUserName: string;
  actionUserId: string;

  durabilityChanges?: DurabilityChangesByEntityId;
  hitPointChanges?: HitPointChanges;
  threatChanges?: ThreatChanges;

  appliedConditions?: Partial<
    Record<HitOutcome, Record<EntityId, SerializedOf<CombatantCondition>[]>>
  >;
  removedConditionStacks?: Record<CombatantId, { conditionId: EntityId; numStacks: number }[]>;
  removedConditionIds?: Record<CombatantId, EntityId[]>;
  removedCombatantIds?: CombatantId[];
  supportClassLevelsGained?: Record<EntityId, CombatantClass>;
  actionEntityIdsDespawned?: { id: EntityId; cleanupMode: CleanupMode }[];
  actionEntityIdsToHide?: EntityId[];
  actionEntityChanges?: Record<EntityId, Partial<ActionEntityActionOriginData>>;
  petSlotsSummoned?: PetSlot[];
  petSlotsReleased?: PetSlot[];
  petsUnsummoned?: CombatantId[];
  petsTamed?: { petId: CombatantId; tamerId: CombatantId }[];
}

export interface HitOutcomesGameUpdateCommand extends IGameUpdateCommand {
  type: GameUpdateCommandType.HitOutcomes;
  actionUserName: string;
  actionUserId: string;
  outcomes: CombatActionHitOutcomes;
  threatChanges?: SerializedOf<ThreatChanges>;
}

export interface ActionCompletionUpdateCommand extends IGameUpdateCommand {
  type: GameUpdateCommandType.ActionCompletion;
  unlockInput?: boolean;
  addDelayToTurnScheduler?: { delay: number; schedulerId: EntityId };
  threatChanges?: SerializedOf<ThreatChanges>;
}

export interface ActionUseGameLogMessageUpdateCommand extends IGameUpdateCommand {
  type: GameUpdateCommandType.ActionUseGameLogMessage;
  actionUseMessageData: ActionUseMessageData;
}

export interface ActionResolutionGameLogMessageUpdateCommand extends IGameUpdateCommand {
  type: GameUpdateCommandType.ActionResolutionGameLogMessage;
  actionUseMessageData: ActionUseMessageData;
  isSuccess?: boolean;
}

export interface BattleConclusionUpdateCommand extends IGameUpdateCommand {
  type: GameUpdateCommandType.BattleConclusion;
  partyName: PartyName;
  conclusion: BattleConclusion;
  timestamp: number;
  loot?: { equipment: Equipment[]; consumables: Consumable[] };
  experiencePointChanges?: Record<CombatantId, number>;
  removedConditionIds?: Record<CombatantId, EntityId[]>;
  removedCombatantIds?: CombatantId[];
  actionEntitiesRemoved?: EntityId[];
}

export type GameUpdateCommand =
  | SpawnEntitiesGameUpdateCommand
  | CombatantMotionGameUpdateCommand
  | ActionEntityMotionGameUpdateCommand
  | ResourcesPaidGameUpdateCommand
  | ActivatedTriggersGameUpdateCommand
  | HitOutcomesGameUpdateCommand
  | ActionCompletionUpdateCommand
  | ActionUseGameLogMessageUpdateCommand
  | ActionResolutionGameLogMessageUpdateCommand
  | BattleConclusionUpdateCommand;
