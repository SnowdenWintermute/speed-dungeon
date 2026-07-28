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
