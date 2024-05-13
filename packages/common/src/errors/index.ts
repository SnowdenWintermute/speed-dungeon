export type CustomErrorDetails = { message: string; field?: string };

export const ERROR_MESSAGES = {
  SERVER_GENERIC: "Internal server error",
  LOBBY: {
    GAME_EXISTS: "A game by that name already exists",
    GAME_DOESNT_EXIST: "No game by that name exists",
    ALREADY_IN_GAME: "You are already in a game",
    GAME_ALREADY_STARTED: "That game has already started",
    ALREADY_IN_PARTY: "You must leave your current party to do that",
    PARTY_NAME_EXISTS: "A party by that name already exists in the current game",
  },
};
