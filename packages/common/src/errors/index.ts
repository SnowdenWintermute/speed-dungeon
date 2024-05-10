export type CustomErrorDetails = { message: string; field?: string };

export const ERROR_MESSAGES = {
  SERVER_GENERIC: "Internal server error",
  LOBBY: {
    GAME_EXISTS: "A game by that name already exists",
    GAME_DOESNT_EXIST: "No game by that name exists",
    ALREADY_IN_GAME: "You are already in a game",
    GAME_ALREADY_STARTED: "That game has already started",
  },
};
