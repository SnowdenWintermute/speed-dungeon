import {
  CombatantId,
  GameId,
  GameName,
  IdentityProviderId,
  LadderCharacterFloorClearRecordId,
  LadderPartyFloorClearRecordId,
  Milliseconds,
  PartyId,
  PartyName,
  Username,
} from "../../aliases.js";
import { CombatantClass } from "../../combatants/combatant-class/classes.js";
import { SerializedCombatantWithPets } from "../../servers/services/user-game-data-persistence/serialized-combatant-with-pets.js";
import { CharacterControlScheme, GameMode } from "../../game-modes/index.js";

// a player's name normally comes from the identity provider, looked up by IdentityProviderId, so
// records always show their current username. lastKnownUsername is refreshed whenever they connect,
// and is what a game record falls back to once the account is deleted and the id resolves to nothing
export interface LadderParticipantRecord {
  id: IdentityProviderId; // primary key
  lastKnownUsername?: Username;
}

// player <-> game junction. exists for every player from game-record creation, independent of
// character ownership (which can transfer between players on abandonment). abandonedAtOption is
// set when the player abandons the run.
export interface LadderGameParticipationRecord {
  gameRecordId: GameId; // foreign key
  participantRecordId: IdentityProviderId; // foreign key
  abandonedAtOption?: Milliseconds;
}

// - Winner derrived from party records timeOfEscape
//    .can rank them by time escaped for 2nd, 3rd place)
//    .only races would have a winner
// - can infer time ended or "in progress" status from party fate records
export interface LadderGameRecord {
  id: GameId; // primary key
  createdAt: Milliseconds;
  updatedAt: Milliseconds;
  name: GameName;
  mode: GameMode;
  controlScheme: CharacterControlScheme;
  timeStarted: Milliseconds;
}

export enum PartyFateType {
  Wipe = "wipe",
  Escape = "escape",
}

export interface PartyFate {
  type: PartyFateType;
  timestamp: Milliseconds;
}

export interface LadderPartyRecord {
  id: PartyId; // primary key
  gameRecordId: GameId;
  name: PartyName;
  fateOption: PartyFate | undefined;
  deepestFloorReached: number;
}

// can derrive "party time to reach floor x" from these
export interface LadderPartyFloorClearRecord {
  id: LadderPartyFloorClearRecordId;
  partyRecordRef: PartyId; // foreign key
  floor: number;
  timeSpentOnFloor: Milliseconds;
  controlScheme: CharacterControlScheme; // the scheme the floor was actually cleared under
}

// denormalized last known basic data about character
export interface LadderCharacterRecord {
  id: CombatantId; // primary key
  name: string;
  mainClass: { combatantClass: CombatantClass; level: number };
  supportClassOption?: { combatantClass: CombatantClass; level: number };
  controllingPlayerId: IdentityProviderId;
  partyRecordId: PartyId;
}

// used for tuning each floor based on discovered meta of character builds at each floor clear
// we will strip out the inventory to save space and focus on their equipment, attributes and abilities
// pets are included since they are part of the build meta
export interface LadderCharacterFloorClearRecord {
  id: LadderCharacterFloorClearRecordId; // primary key
  combatantSchemaVersion: string;
  partyFloorClearRecord: LadderPartyFloorClearRecordId; // foreign key
  characterRecordRef: CombatantId; // foreign key to main character record
  combatantWithPets: SerializedCombatantWithPets; // character + pets, each minus inventory
}
