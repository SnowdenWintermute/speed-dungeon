import { CombatantId, EntityId, IdentityProviderId, Username } from "../aliases.js";
import { SpeedDungeonGame } from "../game/index.js";
import { CharacterSlot } from "../servers/services/saved-characters.js";
import { UserSession } from "../servers/sessions/user-session.js";

export enum CharacterControlScheme {
  Freelancer, // each player controls a single character
  Captain, // each player may control one or more characters
}

export enum GameMode {
  Progression,
  Ironman,
  UnrankedRace,
  RankedRace,
}

export interface GameModePolicy {
  setup: GameModeLobbySetupPolicy;
  persistence: GameModePersistencePolicy;
  ladder: GameModeLadderUpdatePolicy;
}

export class GameModePolicyStore {
  // policies: Record<GameMode, GameModePolicy> = {
  //   //
  // }
  // getPolicies(mode: GameMode):GameModePolicy
}

export interface GameModeLobbySetupPolicy {
  gameCanBeStarted(game: SpeedDungeonGame): { canStart: boolean; reasonCanNot?: string }; // required number of parties, each player controls at least one character
  // is user authenticated if required, if it is IM run were they in that run, does user have tournament ticked if required
  userCanJoin(session: UserSession, game: SpeedDungeonGame): boolean;
  // is user authenticated if required, if it is IM run were they in that run
  // does user have available slots if is IM run
  userCanCreate(session: UserSession, game: SpeedDungeonGame): boolean;
  canSelectStartingFloor(): boolean; // is starting floor selectable in this mode (only for progression)
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

export interface UserAccountPersistentGameData {
  // slots array length limited by user account and control scheme
  progressionCharacters: Record<CharacterControlScheme, CharacterSlot[]>;
  // ironman runs array length limited by user account and control scheme
  ironmanRunIds: Record<CharacterControlScheme, EntityId[]>;
  raceGameRecordIds: Record<CharacterControlScheme, Record<number, EntityId[]>>; // number is year + month (Epoch?)
}

export interface SavedIronmanRun {
  game: SpeedDungeonGame;
  // users know what run ids they are in, they can load one of these records to
  // continue a run, but if they have changed their username since the run was saved
  // we need to know what their name was at the time it was saved so we know what characters
  // they were in control of since character ownership is by player username (so clients don't know account ids)
  userIdsToPlayerNames: Map<IdentityProviderId, Username>;
  // on load, mark the run as in progress so it can't be loaded in two games at once
  isInProgress: boolean;
}

// LadderGameRecord (for ironman/races)
// - game name
// - game mode
// - control mode
// - time started
// - time completed
// - References to participating PartyLadderRecords
// - Winner derrived from party records timeOfEscape
//    .can rank them by time escaped for 2nd, 3rd place)
//    .only races would have a winner

// PartyLadderRecord
// - ref to LadderGameRecord
// - partyId
// - partyName
// - timeOfEscape
// - timeOfWipe
// - references to LadderCharacterRecords
// - references to LadderPartyFloorClearTime records
//
// LadderPartyFloorClearTimeRecord
// - partyId
// - floor number
// - timeToReach
// - timeToClear
//
// LadderCharacterRecord
// - characterName
// - combatantClass
// - level

/** what to save and how to save it when certain events happen
 * will need access to persistence services, or be owned by a composing class that
 * can pass the services to each method
 * */
export interface GameModePersistencePolicy {
  onFloorDescent(): Promise<void>;
  onGameStart(): Promise<void>;
  onBattleResult(): Promise<void>;
  onGameLeave(): Promise<void>;
  onLastPlayerLeftGame(): Promise<void>;
  onPartyEscape(): Promise<void>;
  onPartyWipe(): Promise<void>;
  onPartyVictory(): Promise<void>;
}

/** how to update which ladder when certain events happen
 * will need access to ladder services, or be owned by a composing class that
 * can pass the services to each method
 * */
export interface GameModeLadderUpdatePolicy {
  onFloorDescent(): Promise<void>;
  onGameStart(): Promise<void>;
  onBattleResult(): Promise<void>;
  onGameLeave(): Promise<void>;
  onLastPlayerLeftGame(): Promise<void>;
  onPartyEscape(): Promise<void>;
  onPartyWipe(): Promise<void>;
  onPartyVictory(): Promise<void>;
}
