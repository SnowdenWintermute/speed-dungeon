export type CustomErrorDetails = { message: string; field?: string };

export const ERROR_MESSAGES = {
  SERVER_GENERIC: "Internal server error",
  GAME_DOESNT_EXIST: "No game by that name exists",
  CLIENT: {
    NO_CURRENT_GAME: "This client has no current game",
    NO_USERNAME: "Client doesn't know it's own username",
  },
  LOBBY: {
    GAME_EXISTS: "A game by that name already exists",
    ALREADY_IN_GAME: "You are already in a game",
    GAME_ALREADY_STARTED: "That game has already started",
    ALREADY_IN_PARTY: "You must leave your current party to do that",
    PARTY_NAME_EXISTS: "A party by that name already exists in the current game",
  },
  GAME: {
    MISSING_PARTY_NAME: "Player doesn't have a party name",
    PARTY_DOES_NOT_EXIST: "No party was found with the provided name",
    MAX_PARTY_SIZE: "Maximum party size reached",
    CHARACTER_DOES_NOT_EXIST: "No character was found by the provided id",
    PLAYER_DOES_NOT_EXIST: "No player by that name was found in the game",
    CHARACTER_NOT_OWNED:
      "The provided character is not in the list of that player's owned characters",
  },
  COMBATANT: {
    NOT_FOUND: "No combatant was found with the provided id",
  },
  ABILITIES: {
    NOT_OWNED: "That ability is not owned by that combatant",
  },
  ITEM: {
    NOT_FOUND: "No item was found with the provided ID",
    NOT_OWNED: "An item with the provided ID was not found in this inventory",
    INVALID_TYPE: "Tried to access an item of an invalid type",
  },
};
