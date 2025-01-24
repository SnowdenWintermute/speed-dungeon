export enum ActionAccuracyType {
  Percentage,
  Unavoidable,
}

export type ActionAccuracyPercentage = {
  type: ActionAccuracyType.Percentage;
  value: number;
};

export type ActionAccuracyUnavoidable = {
  type: ActionAccuracyType.Unavoidable;
};

export type ActionAccuracy = ActionAccuracyPercentage | ActionAccuracyUnavoidable;
