import { Vector3 } from "@babylonjs/core";
import { EntityId } from "../primatives/index.js";
import { ActionResourceCosts, CombatActionName, HpChange } from "../combat/index.js";
import { DurabilityChangesByEntityId } from "../combat/action-results/calculate-action-durability-changes.js";

export enum GameUpdateCommandType {
  CombatantMovement,
  CombatantAnimation,
  ResourcesPaid,
  ActivatedTriggers,
  HitOutcomes,
  StaticVfx,
  MobileVfx,
}

export const GAME_UPDATE_COMMAND_TYPE_STRINGS: Record<GameUpdateCommandType, string> = {
  [GameUpdateCommandType.CombatantAnimation]: "CombatantAnimation",
  [GameUpdateCommandType.CombatantMovement]: "CombatantMovement",
  [GameUpdateCommandType.ResourcesPaid]: "ResourcesPaid",
  [GameUpdateCommandType.ActivatedTriggers]: "ActivatedTriggers",
  [GameUpdateCommandType.HitOutcomes]: "HitOutcomes",
  [GameUpdateCommandType.StaticVfx]: "StaticVfx",
  [GameUpdateCommandType.MobileVfx]: "MobileVfx",
};

export type CombatantMovementGameUpdateCommand = {
  type: GameUpdateCommandType.CombatantMovement;
  completionOrderId: null | number;
  animationName: string; // run forward, run backward @TODO -enum
  combatantId: EntityId;
  destination: Vector3;
};

export type CombatantAnimationGameUpdateCommand = {
  type: GameUpdateCommandType.CombatantAnimation;
  completionOrderId: null | number;
  combatantId: EntityId;
  destination: Vector3;
  animationName: string; // @TODO -enum
  duration: number;
};

export type ResourcesPaidGameUpdateCommand = {
  type: GameUpdateCommandType.ResourcesPaid;
  completionOrderId: null | number;
  combatantId: EntityId;
  costsPaid: ActionResourceCosts;
};

export type ActivatedTriggersGameUpdateCommand = {
  type: GameUpdateCommandType.ActivatedTriggers;
  completionOrderId: null | number;
};

export type HitOutcomesGameUpdateCommand = {
  type: GameUpdateCommandType.HitOutcomes;
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

export type StaticVfxGameUpdateCommand = {
  type: GameUpdateCommandType.StaticVfx;
  completionOrderId: null | number;
  vfxName: string; // @TODO -enum;
  position: Vector3;
  effectDuration: number;
  triggerNextStepDuration: number;
};

export type MobileVfxGameUpdateCommand = {
  type: GameUpdateCommandType.MobileVfx;
  completionOrderId: null | number;
  vfxName: string;
  startPosition: Vector3;
  destination: Vector3;
  translationDuration: number;
};

export type GameUpdateCommand =
  | CombatantMovementGameUpdateCommand
  | CombatantAnimationGameUpdateCommand
  | ResourcesPaidGameUpdateCommand
  | ActivatedTriggersGameUpdateCommand
  | HitOutcomesGameUpdateCommand
  | StaticVfxGameUpdateCommand
  | MobileVfxGameUpdateCommand;
