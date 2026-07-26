import { Milliseconds } from "@speed-dungeon/common";

export enum LadderQueryStatus {
  Loading,
  Loaded,
  Failed,
}

export type LadderQueryState<TResult> =
  | { type: LadderQueryStatus.Loading }
  | { type: LadderQueryStatus.Loaded; result: TResult; lastUpdatedAt: Milliseconds }
  | { type: LadderQueryStatus.Failed; message: string };
