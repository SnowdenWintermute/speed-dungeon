import {
  CharacterControlScheme,
  EntityId,
  GameId,
  LadderPartyFloorClearRecordId,
  Username,
} from "@speed-dungeon/common";

// one place builds every link into the ladder, since a row's cells are written per board.
// the character, floor clear and profile pages are still to be built
export function experiencePointsBoardRoute(controlScheme: CharacterControlScheme): string {
  return `/ladder/experience-points?controlScheme=${controlScheme}`;
}

export function cumulativeClearTimesBoardRoute(controlScheme: CharacterControlScheme): string {
  return `/ladder/cumulative-clear-times?controlScheme=${controlScheme}`;
}

export function progressionCharacterRoute(characterId: EntityId): string {
  return `/ladder/character/${characterId}`;
}

export function floorClearRoute(floorClearId: LadderPartyFloorClearRecordId): string {
  return `/ladder/floor-clear/${floorClearId}`;
}

export function gameRecordRoute(gameRecordId: GameId): string {
  return `/ladder/game/${gameRecordId}`;
}

export function playerProfileRoute(username: Username): string {
  return `/profile/${encodeURIComponent(username)}`;
}
