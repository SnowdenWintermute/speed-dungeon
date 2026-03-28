import { Percentage } from "../../aliases.js";

export enum ActionAccuracyType {
  Percentage,
  Unavoidable,
}

export interface ActionAccuracyPercentage {
  type: ActionAccuracyType.Percentage;
  value: Percentage;
}

export interface ActionAccuracyUnavoidable {
  type: ActionAccuracyType.Unavoidable;
}

export type ActionAccuracy = ActionAccuracyPercentage | ActionAccuracyUnavoidable;

export function formatActionAccuracy(actionAccuracy: ActionAccuracy): string {
  switch (actionAccuracy.type) {
    case ActionAccuracyType.Percentage:
      return `${Math.floor(actionAccuracy.value)}%`;
    case ActionAccuracyType.Unavoidable:
      return `unavoidable`;
  }
}
