import { READ_SAVED_RUN_ROUTE } from "@/generated-file-route";
import { STUDY_NAME_SLUGS, StudyName } from "@/studies/study-name";

export const SAVED_RUN_DIRECTORY = "packages/balance-tools/saved-runs";

export function savedRunFileName(studyName: StudyName) {
  return `${STUDY_NAME_SLUGS[studyName]}.json`;
}

/** where the dev server writes it, repo-relative, which is what the write route expects */
export function savedRunWritePath(studyName: StudyName) {
  return `${SAVED_RUN_DIRECTORY}/${savedRunFileName(studyName)}`;
}

/** the dev server route that reads it back, which 404s honestly when there is no saved run */
export function savedRunFetchUrl(studyName: StudyName) {
  return `${READ_SAVED_RUN_ROUTE}/${savedRunFileName(studyName)}`;
}
