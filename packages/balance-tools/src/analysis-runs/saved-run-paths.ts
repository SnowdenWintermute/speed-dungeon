import {
  READ_SAVED_RUN_ROUTE,
  SAVED_RUN_DIRECTORY,
  savedRunFileName,
} from "../generated-file-contract.ts";
import { STUDY_NAME_SLUGS, StudyName } from "../studies/study-name.ts";

/** where the dev server writes it, repo-relative, which is what the write route expects */
export function savedRunWritePath(studyName: StudyName) {
  return `${SAVED_RUN_DIRECTORY}/${savedRunFileName(STUDY_NAME_SLUGS[studyName])}`;
}

/** the dev server route that reads it back, which 404s honestly when there is no saved run */
export function savedRunFetchUrl(studyName: StudyName) {
  return `${READ_SAVED_RUN_ROUTE}/${savedRunFileName(STUDY_NAME_SLUGS[studyName])}`;
}
