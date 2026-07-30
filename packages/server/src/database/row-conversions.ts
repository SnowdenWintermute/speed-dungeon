import {
  CHARACTER_CONTROL_SCHEME_STRINGS,
  CharacterControlScheme,
  GAME_MODE_STRINGS,
  GameMode,
  MapUtils,
  Milliseconds,
  invariant,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";

// the DB stores enums as their forward-mapped display string, and the *_STRINGS maps only go
// enum -> string, so reading a row back needs the reverse
const GAME_MODE_FROM_STRING = MapUtils.invert(
  new Map(iterateNumericEnumKeyedRecord(GAME_MODE_STRINGS))
);
const CONTROL_SCHEME_FROM_STRING = MapUtils.invert(
  new Map(iterateNumericEnumKeyedRecord(CHARACTER_CONTROL_SCHEME_STRINGS))
);

export function gameModeFromString(value: string): GameMode {
  const mode = GAME_MODE_FROM_STRING.get(value);
  invariant(mode !== undefined, `unknown game mode string from db: ${value}`);
  return mode;
}

export function controlSchemeFromString(value: string): CharacterControlScheme {
  const scheme = CONTROL_SCHEME_FROM_STRING.get(value);
  invariant(scheme !== undefined, `unknown control scheme string from db: ${value}`);
  return scheme;
}

export function timestampToMs(value: Date | string | null): Milliseconds | undefined {
  if (value === null) return undefined;
  return new Date(value).getTime() as Milliseconds;
}
