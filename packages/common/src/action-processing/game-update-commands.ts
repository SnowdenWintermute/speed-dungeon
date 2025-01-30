import { Vector3 } from "@babylonjs/core";
import { EntityId } from "../primatives/index.js";
import { ActionResourceCosts, CombatActionName, HpChange } from "../combat/index.js";
import { DurabilityChangesByEntityId } from "../combat/action-results/calculate-action-durability-changes.js";

export enum GameUpdateCommandType {
  CombatantAnimation,
  CombatantMovement,
  CombatantEquipmentAnimation,
  ResourcesPaid,
  HitOutcomes,
  StaticVfx,
  MobileVfx,
}

export type CombatantMovementGameUpdateCommand = {
  type: GameUpdateCommandType.CombatantMovement;
  animationName: string; // run forward, run backward @TODO -enum
  combatantId: EntityId;
  destination: Vector3;
};

export type CombatantAnimationGameUpdateCommand = {
  type: GameUpdateCommandType.CombatantAnimation;
  combatantId: EntityId;
  destination: Vector3;
  animationName: string; // @TODO -enum
  duration: number;
};

export type CombatantEquipmentAnimationGameUpdateCommand = {
  type: GameUpdateCommandType.CombatantEquipmentAnimation;
  combatantId: EntityId;
  equipmentId: EntityId;
  animationName: string; // @TODO -enum
  duration: number;
};

export type ResourcesPaidGameUpdateCommand = {
  type: GameUpdateCommandType.ResourcesPaid;
  combatantId: EntityId;
  costsPaid: ActionResourceCosts;
};

export type HitOutcomesGameUpdateCommand = {
  type: GameUpdateCommandType.HitOutcomes;
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

export type StaticVfxGameUpdateCommand = {
  type: GameUpdateCommandType.StaticVfx;
  name: string; // @TODO -enum;
  position: Vector3;
  animationDuration: number;
  triggerNextStepDuration: number;
};

export type MobileVfxGameUpdateCommand = {
  type: GameUpdateCommandType.MobileVfx;
  name: string; // @TODO -enum;
  startPosition: Vector3;
  destination: Vector3;
  translationDuration: number;
  triggerNextStepDuration: number;
};

export type GameUpdateCommand =
  | CombatantMovementGameUpdateCommand
  | CombatantAnimationGameUpdateCommand
  | CombatantEquipmentAnimationGameUpdateCommand
  | ResourcesPaidGameUpdateCommand
  | HitOutcomesGameUpdateCommand
  | StaticVfxGameUpdateCommand
  | MobileVfxGameUpdateCommand;
