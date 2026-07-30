import {
  CharacterControlScheme,
  GAME_MODE_STRINGS,
  GameMode,
  controlSchemePlural,
} from "@speed-dungeon/common";

// what each board is called, without the facet it is being read at. the tab bar links to a board
// before any facet is chosen, so it shows these bare; a board page states its own facet beside it
export const LADDER_BOARD_NAMES = {
  EXPERIENCE_POINTS: "Progression Experience Points",
  CUMULATIVE_CLEAR_TIMES: "Deepest Cumulative Time To Clear",
  FLOOR_CLEAR_TIMES: "Fastest Floor Clears",
} as const;

export function experiencePointsBoardTitle(controlScheme: CharacterControlScheme): string {
  return `${LADDER_BOARD_NAMES.EXPERIENCE_POINTS} [${controlSchemePlural(controlScheme)}]`;
}

export function cumulativeClearTimesBoardTitle(controlScheme: CharacterControlScheme): string {
  return `${LADDER_BOARD_NAMES.CUMULATIVE_CLEAR_TIMES} [${controlSchemePlural(controlScheme)}]`;
}

export function floorClearTimesBoardTitle(
  mode: GameMode,
  controlScheme: CharacterControlScheme
): string {
  const facet = `${GAME_MODE_STRINGS[mode]} ${controlSchemePlural(controlScheme)}`;
  return `${LADDER_BOARD_NAMES.FLOOR_CLEAR_TIMES} [${facet}]`;
}

export const LADDER_EMPTY_MESSAGES = {
  NO_RANKED_CHARACTERS: "No characters ranked yet.",
  NO_FLOOR_CLEARS: "No floor clears recorded yet.",
} as const;
