import { CombatantId } from "../aliases.js";
import { SpeedDungeonGame } from "../game/index.js";
import { AllowedResult } from "../primatives/index.js";
import { UserSession } from "../servers/sessions/user-session.js";

export interface GameModeLobbySetupPolicy {
  // required number of parties, each player controls at least one character
  gameCanBeStarted(game: SpeedDungeonGame): AllowedResult;
  // is user authenticated if required, if it is IM run were they in that run, does user have tournament ticked if required
  userCanJoin(session: UserSession, game: SpeedDungeonGame): AllowedResult;
  // is user authenticated if required, if it is IM run were they in that run
  // does user have available slots if is IM run
  userCanCreate(session: UserSession): AllowedResult;
  canSelectStartingFloor(): AllowedResult; // is starting floor selectable in this mode (only for progression)
  getMaxStartingFloor(game: SpeedDungeonGame): number;
  // for Ironman, put them in default party and assign them to their characters
  // for Progression, put them in default party and select one of their default characters if they have one
  // for games where they need to create characters, send a message to prompt them to create characters
  onJoin(session: UserSession, game: SpeedDungeonGame): Promise<void>;
  getSelectableCharacterIds(
    session: UserSession,
    // read control scheme, if ironman/race they can't select must
    // create or be assigned to previously owned characters in a continued run
    game: SpeedDungeonGame
  ): Promise<CombatantId[]>;
}
