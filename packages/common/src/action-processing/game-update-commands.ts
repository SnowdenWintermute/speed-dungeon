import { Vector3 } from "@babylonjs/core";
import { EntityId } from "../primatives/index.js";
import { CombatActionName, HpChange } from "../combat/index.js";
import { DurabilityChangesByEntityId } from "../combat/action-results/calculate-action-durability-changes.js";

export enum GameUpdateCommandType {
  CombatantAnimation,
  CombatantMovement,
  CombatantEquipmentAnimation,
  ActionResult,
  StaticVfx,
  MobileVfx,
}

export type CombatantMovementGameUpdateCommand = {
  type: GameUpdateCommandType.CombatantMovement;
  animationName: string; // run forward, run backward @TODO -enum
  combatantId: EntityId;
  destination: Vector3;
  percentToConsiderAsCompleted: number;
};

export type CombatantAnimationGameUpdateCommand = {
  type: GameUpdateCommandType.CombatantAnimation;
  combatantId: EntityId;
  animationName: string; // @TODO -enum
  duration: number;
  percentToConsiderAsCompleted: number;
};

export type CombatantEquipmentAnimationGameUpdateCommand = {
  type: GameUpdateCommandType.CombatantEquipmentAnimation;
  combatantId: EntityId;
  equipmentId: EntityId;
  animationName: string; // @TODO -enum
  duration: number;
  percentToConsiderAsCompleted: number;
};

export type ActionResultGameUpdateCommand = {
  type: GameUpdateCommandType.ActionResult;
  actionName: CombatActionName;
  // targets: CombatActionTarget
  // children?: PerformCombatActionActionCommandPayload[]
  hpChangesByEntityId: null | {
    [entityId: string]: HpChange;
  };
  mpChangesByEntityId: null | {
    [entityId: string]: number;
  };
  // condition changes
  missesByEntityId: string[];
  durabilityChanges?: DurabilityChangesByEntityId;
};

export type StaticVfxGameUpdateCommand = {
  type: GameUpdateCommandType.StaticVfx;
  name: string; // @TODO -enum;
  position: Vector3;
  duration: number;
  percentToConsiderAsCompleted: number;
};

export type MobileVfxGameUpdateCommand = {
  type: GameUpdateCommandType.MobileVfx;
  name: string; // @TODO -enum;
  duration: number;
  startPosition: Vector3;
  destination: Vector3;
  percentToConsiderAsCompleted: number;
};

export type GameUpdateCommand =
  | CombatantMovementGameUpdateCommand
  | CombatantAnimationGameUpdateCommand
  | CombatantEquipmentAnimationGameUpdateCommand
  | ActionResultGameUpdateCommand
  | StaticVfxGameUpdateCommand
  | MobileVfxGameUpdateCommand;
