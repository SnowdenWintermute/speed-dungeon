import { ActionResult } from "@speed-dungeon/common";
import { Quaternion, Vector3 } from "babylonjs";

export enum CombatantModelActionType {
  ApproachDestination,
  ReturnHome,
  Recenter,
  TurnToTowardTarget,
  PerformCombatAction,
  HitRecovery,
  Evade,
  Death,
  Idle,
}

export class CombatantModelActionProgressTracker {
  timeStarted: number = Date.now();
  transitionStarted: null | number = null;
  constructor(public modelAction: CombatantModelAction) {}
}

type ApproachDestinationModelAction = {
  type: CombatantModelActionType.ApproachDestination;
  previousLocation: Vector3;
  previousRotation: Quaternion;
  distance: number;
  destinationLocation: Vector3;
  destinationRotation: Quaternion;
};

type ReturnHomeModelAction = {
  type: CombatantModelActionType.ReturnHome;
  previousLocation: Vector3;
};

type RecenterModelAction = {
  type: CombatantModelActionType.ReturnHome;
  previousRotation: number;
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

export type CombatantModelAction =
  | ApproachDestinationModelAction
  | ReturnHomeModelAction
  | RecenterModelAction
  | TurnTowardTargetModelAction
  | PerformCombatActionModelAction
  | HitRecoveryModelAction
  | EvadeModelAction
  | DeathModelAction
  | IdleModelAction;
