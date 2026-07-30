export enum LadderQueryStatus {
  Loading,
  Loaded,
  Failed,
}

export type LadderQueryState<TResult> =
  | { type: LadderQueryStatus.Loading }
  | { type: LadderQueryStatus.Loaded; result: TResult }
  | { type: LadderQueryStatus.Failed; message: string };
