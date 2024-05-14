import {
  PLAYER_FIRST_NAMES,
  PLAYER_LAST_NAMES,
  RANDOM_CHARACTER_NAMES_FIRST,
  RANDOM_GAME_NAMES_FIRST,
  RANDOM_GAME_NAMES_LAST,
  RANDOM_PARTY_NAMES,
} from "../random-names";

export function generateRandomUsername() {
  const firstName = PLAYER_FIRST_NAMES[Math.floor(Math.random() * PLAYER_FIRST_NAMES.length)];
  const lastName = PLAYER_LAST_NAMES[Math.floor(Math.random() * PLAYER_LAST_NAMES.length)];
  return `${firstName} ${lastName}`;
}

export function generateRandomGameName() {
  const firstName =
    RANDOM_GAME_NAMES_FIRST[Math.floor(Math.random() * RANDOM_GAME_NAMES_FIRST.length)];
  const lastName =
    RANDOM_GAME_NAMES_LAST[Math.floor(Math.random() * RANDOM_GAME_NAMES_LAST.length)];
  return `${firstName} ${lastName}`;
}

export function generateRandomPartyName() {
  return RANDOM_PARTY_NAMES[Math.floor(Math.random() * RANDOM_PARTY_NAMES.length)];
}

export function generateRandomCharacterName() {
  return RANDOM_CHARACTER_NAMES_FIRST[
    Math.floor(Math.random() * RANDOM_CHARACTER_NAMES_FIRST.length)
  ];
}
