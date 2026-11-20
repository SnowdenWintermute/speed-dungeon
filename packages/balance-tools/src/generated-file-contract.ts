// deliberately import-free: the vite config and the client both read this, and taking it from the
// plugin file instead would pull node:fs into the client bundle, where nodePolyfills shims it
// rather than failing
export const WRITE_GENERATED_FILE_ROUTE = "/__write-generated-file";

/**
 * Saved runs are read back through the dev server rather than served out of public/. Two reasons:
 * vite registers publicDir once at startup, so a run saved into a directory that did not exist when
 * the server booted is silently answered by the SPA fallback instead; and that fallback returns
 * index.html with a 200, which makes a missing run indistinguishable from a present one by status.
 */
export const READ_SAVED_RUN_ROUTE = "/__saved-run";
/** answers with the intensity percents a study has saved runs at */
export const LIST_SAVED_RUNS_ROUTE = "/__saved-run-list";

export const SAVED_RUN_DIRECTORY = "packages/balance-tools/saved-runs";
export const SAVED_RUN_FILE_NAME_PATTERN = /^[a-z0-9-]+\.json$/;

export function savedRunFileName(studySlug: string, intensityPercent: number) {
  return `${studySlug}-i${intensityPercent}.json`;
}

/** null for a file belonging to another study */
export function readSavedRunIntensityPercent(studySlug: string, fileName: string) {
  const match = new RegExp(`^${studySlug}-i(\\d+)\\.json$`).exec(fileName);
  return match === null ? null : Number(match[1]);
}

export const DERIVED_REQUIREMENTS_DIRECTORY =
  "packages/common/src/items/item-creation/equipment-templates";
export const DERIVED_REQUIREMENTS_PREFIX = "requirements-from-";
const DERIVED_REQUIREMENTS_SUFFIX = ".generated.ts";

export function derivedRequirementsFileName(studySlug: string) {
  return `${DERIVED_REQUIREMENTS_PREFIX}${studySlug}${DERIVED_REQUIREMENTS_SUFFIX}`;
}

export function isDerivedRequirementsFileName(name: string) {
  return name.startsWith(DERIVED_REQUIREMENTS_PREFIX) && name.endsWith(DERIVED_REQUIREMENTS_SUFFIX);
}
