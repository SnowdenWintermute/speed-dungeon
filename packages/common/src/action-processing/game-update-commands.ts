import { Vector3 } from "@babylonjs/core";
import { EntityId, Milliseconds } from "../primatives/index.js";
import { ActionResourceCosts, CombatActionName, HpChange } from "../combat/index.js";
import { DurabilityChangesByEntityId } from "../combat/action-results/calculate-action-durability-changes.js";
import { AnimationName } from "../app-consts.js";
import { ActionResolutionStepType } from "./action-steps/index.js";
import { Combatant } from "../combatants/index.js";
import { Vfx } from "../vfx/index.js";

export enum GameUpdateCommandType {
  SpawnEntity,
  EntityMotion,
  ResourcesPaid,
  ActivatedTriggers,
  HitOutcomes,
  EndTurn,
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
  [GameUpdateCommandType.EndTurn]: "End Turn",
};

export type GameEntity = Combatant | Vfx;
export type EntityTranslation = { duration: Milliseconds; destination: Vector3 };
export type EntityAnimation = { duration: Milliseconds; animationName: AnimationName };

export type SpawnEntityGameUpdateCommand = {
  type: GameUpdateCommandType.SpawnEntity;
  step: ActionResolutionStepType;
  completionOrderId: null | number;
  entity: Vfx | Combatant;
};

export type EntityMotionGameUpdateCommand = {
  type: GameUpdateCommandType.EntityMotion;
  completionOrderId: null | number;
  step: ActionResolutionStepType;
  entityId: EntityId;
  animationOption?: { name: AnimationName; durationOption?: Milliseconds; shouldRepeat: boolean };
  translationOption?: EntityTranslation;
};

export type ResourcesPaidGameUpdateCommand = {
  type: GameUpdateCommandType.ResourcesPaid;
  step: ActionResolutionStepType;
  completionOrderId: null | number;
  combatantId: EntityId;
  costsPaid: ActionResourceCosts;
};

export type ActivatedTriggersGameUpdateCommand = {
  type: GameUpdateCommandType.ActivatedTriggers;
  step: ActionResolutionStepType;
  completionOrderId: null | number;
};

export type HitOutcomesGameUpdateCommand = {
  type: GameUpdateCommandType.HitOutcomes;
  step: ActionResolutionStepType;
  completionOrderId: null | number;
  actionName: CombatActionName;
  hpChangesByEntityId?: null | {
    [entityId: string]: HpChange;
  };
  mpChangesByEntityId?: null | {
    [entityId: string]: number;
  };
  // condition changes
  missesByEntityId?: string[];
  evadesByEntityId?: string[];
  durabilityChanges?: DurabilityChangesByEntityId;
};

export type GameUpdateCommand =
  | SpawnEntityGameUpdateCommand
  | EntityMotionGameUpdateCommand
  | ResourcesPaidGameUpdateCommand
  | ActivatedTriggersGameUpdateCommand
  | HitOutcomesGameUpdateCommand;
