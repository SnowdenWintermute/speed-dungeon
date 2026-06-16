import {
  CombatantId,
  GameId,
  GameName,
  IdentityProviderId,
  LadderCharacterFloorClearedRecordId,
  LadderPartyFloorClearedRecordId,
  Milliseconds,
  PartyId,
  PartyName,
  Username,
} from "../../aliases.js";
import { CombatantClass } from "../../combatants/combatant-class/classes.js";
import { SerializedCombatantWithPets } from "../../servers/services/user-game-data-persistence/serialized-combatant-with-pets.js";
import { CharacterControlScheme, GameMode } from "../index.js";

// in case they delete their account we can still show the name of a player in a game record
// if they change their username, old game records should show their updated username
// and typically we would just query for their current name based on their IdentityProviderId
export interface LadderParticipantRecord {
  id: IdentityProviderId; // primary key
  usernameAtTimeOfAccountDeletion?: Username;
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
  id: LadderPartyFloorClearedRecordId;
  partyRecordRef: PartyId; // foreign key
  floor: number;
  timeSpentOnFloor: Milliseconds;
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
export interface LadderCharacterFloorClearedRecord {
  id: LadderCharacterFloorClearedRecordId; // primary key
  combatantSchemaVersion: string;
  partyFloorClearRecord: LadderPartyFloorClearedRecordId; // foreign key
  characterRecordRef: CombatantId; // foreign key to main character record
  combatantWithPets: SerializedCombatantWithPets; // character + pets, each minus inventory
}
