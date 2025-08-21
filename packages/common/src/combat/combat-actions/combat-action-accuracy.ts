import { Percentage } from "../../primatives/index.js";

export enum ActionAccuracyType {
  Percentage,
  Unavoidable,
}

export type ActionAccuracyPercentage = {
  type: ActionAccuracyType.Percentage;
  value: Percentage;
};

export type ActionAccuracyUnavoidable = {
  type: ActionAccuracyType.Unavoidable;
};

export type ActionAccuracy = ActionAccuracyPercentage | ActionAccuracyUnavoidable;

export function formatActionAccuracy(actionAccuracy: ActionAccuracy): string {
  switch (actionAccuracy.type) {
    case ActionAccuracyType.Percentage:
      return `${Math.floor(actionAccuracy.value)}%`;
    case ActionAccuracyType.Unavoidable:
      return `unavoidable`;
  }
}
