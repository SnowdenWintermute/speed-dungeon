import { INVENTORY_DEFAULT_CAPACITY, MAX_CHARACTER_NAME_LENGTH } from "../app-consts.js";

export type CustomErrorDetails = { message: string; field?: string };

export const ERROR_MESSAGES = {
  TODO: "Not yet implemented",
  SERVER_GENERIC: "Internal server error",
  NOT_IMPLEMENTED: "This feature is not yet implemented",
  GAME_DOESNT_EXIST: "No game by that name exists",
  SERVER: {
    USERNAME_HAS_NO_SOCKET_IDS: "No socket IDs were found by that username",
    BROWSER_SESSION_NOT_FOUND: "No browser session was found associated with that socked ID",
    SOCKET_NOT_FOUND: "No socket by that ID was found",
  },
  AUTH: {
    REQUIRED: "Only a logged in user may perform that action",
  },
  CLIENT: {
    NO_CURRENT_GAME: "This client has no current game",
    NO_CURRENT_PARTY: "Expected this client to have a party but couldn't find it",
    NO_USERNAME: "Client doesn't know it's own username",
    NO_SOCKET_OBJECT: "Client is missing their websocket object",
    NO_COMMAND_MANAGER: "Client is missing their action command manager",
  },
  LOBBY: {
    GAME_EXISTS: "A game by that name already exists",
    ALREADY_IN_GAME: "You are already in a game",
    USER_IN_GAME:
      "You must leave any other game (maybe in another open tab or browser) to join a Progression game",
    GAME_ALREADY_STARTED: "That game has already started",
    ALREADY_IN_PARTY: "You must leave your current party to do that",
    PARTY_NAME_EXISTS: "A party by that name already exists in the current game",
  },
  GAME: {
    NOT_STARTED: "The specified game was never started",
    PARTY_DOES_NOT_EXIST: "No party was found with the provided name",
    MAX_PARTY_SIZE: "Maximum party size reached",
    CHARACTER_DOES_NOT_EXIST: "No character was found by the provided ID",
    PLAYER_DOES_NOT_EXIST: "No player by that name was found in the game",
    BATTLE_DOES_NOT_EXIST: "No battle found by that ID",
    MODE: "Your current game mode does not allow for that action",
    NO_SAVED_CHARACTERS: "You must create a saved character to play in that game mode",
    STARTING_FLOOR_LIMIT:
      "You can't start on a deeper floor than the deepest floor reached by any character in your party",
  },
  PARTY: {
    PLAYER_NOT_FOUND: "The provided username does not belong to any player in this party",
    CHARACTER_NOT_FOUND: "No character was found in the party by the provided ID",
    MISSING_CHARACTERS: "Somehow we have a party with no characters",
    CANT_EXPLORE_WHILE_MONSTERS_ARE_PRESENT:
      "Can't explore while there are still monsters in the room",
    NOT_IN_BATTLE: "Party not in a battle",
    NOT_AT_STAIRCASE: "Can't descend if no staircase",
    INPUT_IS_LOCKED: "Can't accept new inputs until current events are resolved",
  },
  LADDER: {
    USER_NOT_FOUND: "No record found for that user",
    CHARACTER_NOT_FOUND: "No record found for that character",
    NO_ENTRIES_FOUND: "No ladder entries found",
  },
  PLAYER: {
    NO_CHARACTERS: "The provided player doesn't own any characters",
    CHARACTER_NOT_OWNED:
      "The provided character is not in the list of that player's owned characters",
    MISSING_PARTY_NAME: "Player doesn't have a party name or party does not exist",
  },
  USER: {
    NO_CURRENT_GAME: "This user has no current game",
    MISSING_PROFILE: "Failed to find expected user profile",
    CHARACTER_SLOT_FULL: "That character slot is occupied",
    SAVED_CHARACTER_NOT_OWNED: "You do not own the character with the provided ID",
    NO_LIVING_CHARACTERS: "You have no characters that are alive",
    NOT_FOUND: "User not found",
  },
  COMBATANT: {
    NOT_FOUND: "No combatant was found with the provided ID",
    NO_ACTION_SELECTED: "That combatant has no selected combat action",
    NO_TARGET_SELECTED: "That combatant has no selected target",
    IS_DEAD: "That combatant is dead",
    NOT_ACTIVE: "It is not that combatant's turn",
    NO_UNSPENT_ATTRIBUTE_POINTS: "That combatant has no unspent attribute points",
    ATTRIBUTE_IS_NOT_ASSIGNABLE: "Points may not be spent on that attribute",
    EXPECTED_OWNER_ID_MISSING: "Failed to find expected controlling player ID",
    MAX_NAME_LENGTH_EXCEEDED: `Character names must be no longer than ${MAX_CHARACTER_NAME_LENGTH} characters`,
    MAX_INVENTORY_CAPACITY: `Combatants may carry no more than ${INVENTORY_DEFAULT_CAPACITY} items`,
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
    CANT_USE_ON_DEAD_TARGET: "That action may only be used on living targets",
    ALREADY_FULL_HP: "The target already has full hit points",
    ALREADY_FULL_MP: "The target already has full mana",
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
    NO_COMBATANT_MODEL: "No combatant model exists with the provided entity ID",
    INCOMPLETE_SKELETON_FILE: "The loaded skeleton asset is missing something",
    MISSING_ROTATION_QUATERNION: "Expected rotation data was missing",
    MISSING_ANIMATION: "No animation found",
    INCORRECT_MODEL_ACTION: "The wrong type of model action was passed to this function",
  },
  CHECKED_EXPECTATION_FAILED:
    "Code was reached that should have been impossible due to prior value checks",
  EVENT_MIDDLEWARE: {
    MISSING_DATA: "Missing expected data in middleware",
    MISSING_SOCKET: "Didn't get the socket passed from socket event middleware",
  },
  SOCKET_EVENTS: {
    MISSING_DATA: "Missing expected data in socket event",
  },
  GAME_RECORDS: {
    NOT_FOUND: "No game record was found by that ID",
    PARTY_RECORD_NOT_FOUND: "Expected party record was not found",
  },
};
