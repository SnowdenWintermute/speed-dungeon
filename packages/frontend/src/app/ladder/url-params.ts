// the schemas parse these and the route builders write them. a name that disagreed between the two
// would read as an absent param and silently fall back to a default, so both sides name them here
export const LADDER_URL_PARAMS = {
  CONTROL_SCHEME: "controlScheme",
  PAGE: "page",
  FLOOR: "floor",
  MODE: "mode",
  SORT_FIELD: "sortField",
  SORT_IS_DESCENDING: "sortIsDescending",
  // as const so a schema can use these as computed keys and still destructure them by name
} as const;

// the dynamic segments a record page's id arrives in. these have to match the [bracketed] directory
// names the route files live under, which nothing checks — a mismatch reads as an absent param, so
// the code side names them here rather than repeating the string
export const LADDER_ROUTE_PARAMS = {
  FLOOR_CLEAR_ID: "floorClearId",
  GAME_RECORD_ID: "gameRecordId",
  CHARACTER_ID: "characterId",
  SNAPSHOT_ID: "snapshotId",
  // the profile route lives outside /ladder, but it is reached from ladder rows and shows ladder
  // data, so its url is parsed and written by the same two files as the rest
  PROFILE_USERNAME: "username",
} as const;
