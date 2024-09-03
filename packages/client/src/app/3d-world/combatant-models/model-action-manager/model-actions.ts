import { Quaternion, Vector3 } from "babylonjs";

export enum CombatantModelActionType {
  ApproachDestination,
  TurnToTowardTarget,
}

export function formatCombatModelActionType(type: CombatantModelActionType) {
  switch (type) {
    case CombatantModelActionType.ApproachDestination:
      return "Approach Destination";
    case CombatantModelActionType.TurnToTowardTarget:
      return "Turn Toward Target";
  }
}

export class CombatantModelActionProgressTracker {
  timeStarted: number = Date.now();
  constructor(public modelAction: CombatantModelAction) {}
}

export type ApproachDestinationModelAction = {
  type: CombatantModelActionType.ApproachDestination;
  previousLocation: Vector3;
  destinationLocation: Vector3;
  timeToTranslate: number;
  previousRotation: Quaternion;
  destinationRotation: Quaternion;
  timeToRotate: number;
  onComplete: () => void;
};

export type TurnTowardTargetModelAction = {
  type: CombatantModelActionType.TurnToTowardTarget;
  previousRotation: number;
  target: Vector3;
};

export type CombatantModelAction = ApproachDestinationModelAction | TurnTowardTargetModelAction;
