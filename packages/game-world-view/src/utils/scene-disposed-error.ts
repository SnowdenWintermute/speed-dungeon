// kept free of babylon imports so consumers that only need to recognize this error don't pull the
// engine and loaders into their bundle
export const SCENE_DISPOSED_BEFORE_ASSET_LOAD = "scene disposed before asset load";

export function isExpectedSceneDisposedError(unknownError: any) {
  return unknownError instanceof Error && unknownError.message === SCENE_DISPOSED_BEFORE_ASSET_LOAD;
}
