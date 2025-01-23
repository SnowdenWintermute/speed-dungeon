export enum ActionAccuracyType {
  NormalizedPercentage,
  Unavoidable,
}

export type ActionAccuracyPercentage = {
  type: ActionAccuracyType.NormalizedPercentage;
  value: number;
};

export type ActionAccuracyUnavoidable = {
  type: ActionAccuracyType.Unavoidable;
};

export type ActionAccuracy = ActionAccuracyPercentage | ActionAccuracyUnavoidable;
