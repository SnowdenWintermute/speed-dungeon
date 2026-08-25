export interface AnalysisRunSetResult {
  /** runs that threw and contributed nothing, so a short set is visible rather than silent */
  runsFailed: number;
}

/**
 * A study's set of walks. Implementations flatten each run's report as it finishes, so the report,
 * which holds live Equipment, can be dropped instead of retained across the whole set.
 */
export interface AnalysisRunSet<TResult extends AnalysisRunSetResult> {
  executeSet(runCount: number, onRunFinished: (runsFinished: number) => void): void;
  result: TResult;
}
