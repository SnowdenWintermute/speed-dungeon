import { ActionResult } from "@speed-dungeon/common";
import { Animation, Quaternion, Vector3 } from "babylonjs";

export enum CombatantModelActionType {
  ApproachDestination,
  ReturnHome,
  TurnToTowardTarget,
  PerformCombatAction,
  HitRecovery,
  Evade,
  Death,
  EndTurn,
  Idle,
}

export function formatCombatModelActionType(type: CombatantModelActionType) {
  switch (type) {
    case CombatantModelActionType.ApproachDestination:
      return "Approach Destination";
    case CombatantModelActionType.ReturnHome:
      return "Return Home";
    case CombatantModelActionType.TurnToTowardTarget:
      return "Turn Toward Target";
    case CombatantModelActionType.PerformCombatAction:
      return "Perform Combat Action";
    case CombatantModelActionType.HitRecovery:
      return "Hit Recovery";
    case CombatantModelActionType.Evade:
      return "Evade";
    case CombatantModelActionType.Death:
      return "Death";
    case CombatantModelActionType.EndTurn:
      return "End Turn";
    case CombatantModelActionType.Idle:
      return "Idle";
  }
}

export class CombatantModelActionProgressTracker {
  timeStarted: number = Date.now();
  transitionStarted: null | number = null;
  animationEnded: boolean = false;
  constructor(
    public modelAction: CombatantModelAction,
    public animationOption: null | Animation
  ) {}
}

type ApproachDestinationModelAction = {
  type: CombatantModelActionType.ApproachDestination | CombatantModelActionType.ReturnHome;
  previousLocation: Vector3;
  previousRotation: Quaternion;
  distance: number;
  destinationLocation: Vector3;
  destinationRotation: Quaternion;
  rotationDistance: number;
  transitionToNextActionStarted: boolean;
};

type TurnTowardTargetModelAction = {
  type: CombatantModelActionType.TurnToTowardTarget;
  previousRotation: number;
  target: Vector3;
};

type PerformCombatActionModelAction = {
  type: CombatantModelActionType.PerformCombatAction;
  actionResult: ActionResult;
};

type HitRecoveryModelAction = {
  type: CombatantModelActionType.HitRecovery;
  damage: number;
};

type EvadeModelAction = {
  type: CombatantModelActionType.Evade;
};

type DeathModelAction = {
  type: CombatantModelActionType.Death;
};

type IdleModelAction = {
  type: CombatantModelActionType.Idle;
};

type EndTurnModelAction = {
  type: CombatantModelActionType.EndTurn;
};

export type CombatantModelAction =
  | ApproachDestinationModelAction
  | TurnTowardTargetModelAction
  | PerformCombatActionModelAction
  | HitRecoveryModelAction
  | EvadeModelAction
  | DeathModelAction
  | EndTurnModelAction
  | IdleModelAction;
