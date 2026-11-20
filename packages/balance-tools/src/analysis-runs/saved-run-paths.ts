import type { NormalizedPercentage } from "@speed-dungeon/common";
import {
  LIST_SAVED_RUNS_ROUTE,
  READ_SAVED_RUN_ROUTE,
  SAVED_RUN_DIRECTORY,
  savedRunFileName,
} from "../generated-file-contract.ts";
import { STUDY_NAME_SLUGS, StudyName } from "../studies/study-name.ts";
import type { DungeonRunAnalysis, DungeonRunAnalysisResults } from "./dungeon-run-analysis.ts";
import type { AnalysisRunSetOptions } from "./run-set-worker-messages.ts";

export interface SavedRun<AnalysisType extends DungeonRunAnalysis> {
  runCount: number;
  options: AnalysisRunSetOptions;
  result: DungeonRunAnalysisResults[AnalysisType];
}

export function intensityPercent(intensity: NormalizedPercentage) {
  return Math.round(intensity * 100);
}

function fileNameOf(studyName: StudyName, intensity: NormalizedPercentage) {
  return savedRunFileName(STUDY_NAME_SLUGS[studyName], intensityPercent(intensity));
}

/** where the dev server writes it, repo-relative, which is what the write route expects */
export function savedRunWritePath(studyName: StudyName, intensity: NormalizedPercentage) {
  return `${SAVED_RUN_DIRECTORY}/${fileNameOf(studyName, intensity)}`;
}

/** the dev server route that reads it back, which 404s honestly when there is no saved run */
export function savedRunFetchUrl(studyName: StudyName, intensity: NormalizedPercentage) {
  return `${READ_SAVED_RUN_ROUTE}/${fileNameOf(studyName, intensity)}`;
}

export async function fetchSavedRunIntensityPercents(studyName: StudyName): Promise<number[]> {
  const response = await fetch(`${LIST_SAVED_RUNS_ROUTE}/${STUDY_NAME_SLUGS[studyName]}`);
  return response.ok ? await response.json() : [];
}
