import {
  GameName,
  IdentityProviderId,
  LadderCharacterFloorClearedRecordId,
  LadderCharacterRecordId,
  LadderGameRecordId,
  LadderParticipantRecordId,
  LadderPartyFloorClearedRecordId,
  LadderPartyRecordId,
  Milliseconds,
  PartyName,
  Username,
} from "../../aliases.js";
import { CombatantClass } from "../../combatants/combatant-class/classes.js";
import { Combatant } from "../../combatants/index.js";
import { SerializedOf } from "../../serialization/index.js";
import { CharacterControlScheme, GameMode } from "../index.js";

// in case they delete their account we can still show the name of a player in a game record
// if they change their username, old game records should show their updated username
// and typically we would just query for their current name based on their IdentityProviderId
export interface LadderParticipantRecord {
  id: LadderParticipantRecordId; // primary key
  userId: IdentityProviderId;
  usernameAtTimeOfAccountDeletion?: Username;
}

// - Winner derrived from party records timeOfEscape
//    .can rank them by time escaped for 2nd, 3rd place)
//    .only races would have a winner
// - can infer time ended or "in progress" status from party fate records
export interface LadderGameRecord {
  id: LadderGameRecordId; // primary key
  createdAt: Milliseconds;
  updatedAt: Milliseconds;
  name: GameName;
  mode: GameMode;
  controlScheme: CharacterControlScheme;
  timeStarted: Milliseconds;
  partyRecordRefs: LadderPartyRecordId[];
  participantRecords: LadderParticipantRecordId[];
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
  id: LadderPartyRecordId; // primary key
  gameRecordId: LadderGameRecordId;
  name: PartyName;
  fateOption: PartyFate | undefined;
  deepestFloorReached: number;
  characterRecordRefs: LadderCharacterRecordId[];
  partyFloorClearRecordRefs: LadderPartyFloorClearedRecordId[];
}

// can derrive "party time to reach floor x" from these
export interface LadderPartyFloorClearRecord {
  id: LadderPartyFloorClearedRecordId;
  partyRecordRef: LadderPartyRecordId; // foreign key
  floor: number;
  timeSpentOnFloor: Milliseconds;
}

// denormalized last known basic data about character
export interface LadderCharacterRecord {
  id: LadderCharacterRecordId; // primary key
  name: string;
  mainClass: CombatantClass;
  mainClassLevel: number;
  supportClassOption: CombatantClass | undefined;
  supportClassOptionLevel: number;
  controllingPlayerId: LadderParticipantRecordId;
  partyRecordId: LadderPartyRecordId;
  floorClearRecordIds: LadderCharacterFloorClearedRecordId[]; // foreign keys
}

// used for tuning each floor based on discovered meta of character builds at each floor clear
// we will strip out the inventory to save space and focus on their equipment, attributes and abilities
export interface LadderCharacterFloorClearedRecord {
  id: LadderCharacterFloorClearedRecordId; // primary key
  combatantSchemaVersion: string;
  partyFloorClearRecord: LadderPartyFloorClearedRecordId; // foreign key
  characterRecordRef: LadderCharacterRecordId; // foreign key to main character record
  combatant: SerializedOf<Combatant>; // entire character serialized minus their inventory
}
