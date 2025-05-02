import { Percentage } from "../../primatives";

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
