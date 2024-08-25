export type CustomErrorDetails = { message: string; field?: string };

export const ERROR_MESSAGES = {
  TODO: "Not yet implemented",
  SERVER_GENERIC: "Internal server error",
  SERVER: {
    USERNAME_HAS_NO_SOCKET_IDS: "No socket ids were found by that username",
    BROWSER_SESSION_NOT_FOUND: "No browser session was found associated with that socked id",
    SOCKET_NOT_FOUND: "No socket by that id was found",
  },
  GAME_DOESNT_EXIST: "No game by that name exists",
  CLIENT: {
    NO_CURRENT_GAME: "This client has no current game",
    NO_CURRENT_PARTY: "Expected this client to have a party but couldn't find it",
    NO_USERNAME: "Client doesn't know it's own username",
    NO_SOCKET_OBJECT: "Client is missing their websocket object",
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
    BATTLE_DOES_NOT_EXIST: "No battle found by that id",
  },
  PARTY: {
    PLAYER_NOT_FOUND: "The provided username does not belong to any player in this party",
    CHARACTER_NOT_FOUND: "No character was found in the party by the provided id",
    MISSING_CHARACTERS: "Somehow we have a party with no characters",
    CANT_EXPLORE_WHILE_MONSTERS_ARE_PRESENT:
      "Can't explore while there are still monsters in the room",
  },
  PLAYER: {
    NO_CHARACTERS: "The provided player doesn't own any characters",
    CHARACTER_NOT_OWNED:
      "The provided character is not in the list of that player's owned characters",
  },
  USER: {
    NO_CURRENT_GAME: "This user has no current game",
  },
  COMBATANT: {
    NOT_FOUND: "No combatant was found with the provided id",
    NO_ACTION_SELECTED: "That combatant has no selected combat action",
    NO_TARGET_SELECTED: "That combatant has no selected target",
    IS_DEAD: "Dead combatants may not take any actions",
    NOT_ACTIVE: "It is not that combatant's turn",
  },
  MONSTERS: {
    NO_MONSTERS_FOUND: "No monsters were found in the current room",
  },
  ABILITIES: {
    NOT_OWNED: "That ability is not owned by that combatant",
    INVALID_TYPE: "Invalid ability type",
    INSUFFICIENT_MANA: "Not enough mana",
  },
  COMBAT_ACTIONS: {
    NO_VALID_TARGETS: "No valid targets were found for the selected action",
    ONLY_ONE_TARGETING_SCHEME_AVAILABLE:
      "There is only one targeting scheme available for that action",
    NO_TARGETING_SCHEMES: "That ability has no targeting schemes",
    INVALID_TARGETS_SELECTED: "The selected action can not be used on the provided targets",
    MISSING_HP_CHANGE_PROPERTIES:
      "The provided combat action doesn't specify any Hp change properties",
    NO_TARGET_PROVIDED: "Combat actions must have at least one target",
    INVALID_USABILITY_CONTEXT: "That action is not allowed in this context",
  },
  ITEM: {
    NOT_FOUND: "No item was found with the provided ID",
    NOT_OWNED: "An item with the provided ID was not found in this inventory",
    INVALID_TYPE: "Tried to access an item of an invalid type",
    NOT_YET_AVAILABLE: "The requested item is not yet available",
    ACKNOWLEDGEMENT_SENT_BEFORE_ITEM_EXISTED:
      "How can you acknowledge receipt of an item if it isn't registered yet?",
  },
  EQUIPMENT: {
    INVALID_TYPE: "Invalid equipment type was provided",
    NO_ITEM_EQUIPPED: "No item is equipped in that slot",
    REQUIREMENTS_NOT_MET: "You don't meet the requirements to equip that item",
  },
  BATTLE: {
    COMBATANT_NOT_IN_BATTLE: "The provided ID did not match any combatant in this battle",
    TURN_TRACKERS_EMPTY: "Battle has no combatant turn trackers",
  },
  GAME_WORLD: {
    NO_COMBATANT_MODEL: "No combatant model exists with the provided entity id",
    INCOMPLETE_SKELETON_FILE: "The loaded skeleton asset is missing something",
    MISSING_ROTATION_QUATERNION: "Expected rotation data was missing",
    MISSING_ANIMATION: "No animation found",
    INCORRECT_MODEL_ACTION: "The wrong type of model action was passed to this function",
  },
  CHECKED_EXPECTATION_FAILED:
    "Code was reached that should have been impossible due to prior value checks",
};
