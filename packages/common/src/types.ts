import { AdventuringParty } from "./adventuring-party/index.js";
import { Combatant, CombatantClass } from "./combatants/index.js";
import { SpeedDungeonGame, SpeedDungeonPlayer } from "./game/index.js";

export interface CharacterAssociatedData {
  character: Combatant;
  player: SpeedDungeonPlayer;
  game: SpeedDungeonGame;
  party: AdventuringParty;
}

export interface CombatantAssociatedData {
  game: SpeedDungeonGame;
  party: AdventuringParty;
  combatant: Combatant;
}

export interface PlayerAssociatedData {
  player: SpeedDungeonPlayer;
  game: SpeedDungeonGame;
  partyOption: AdventuringParty | undefined;
}

export enum GameMode {
  Race,
  Progression,
}

export function formatGameMode(gameMode: GameMode) {
  switch (gameMode) {
    case GameMode.Race:
      return "Race";
    case GameMode.Progression:
      return "Progression";
  }
}

export type LevelLadderEntry = {
  owner: string;
  characterName: string;
  characterId: string;
  level: number;
  experience: number;
  rank: number;
  gameVersion: string;
};

export enum PartyFate {
  Wipe = "wipe",
  Escape = "escape",
}

export type RaceGameAggregatedRecord = {
  game_id: string;
  game_name: string;
  game_version: string;
  time_of_completion: null | number;
  parties: {
    [partyName: string]: RacePartyAggregatedRecord;
  };
};

export type RacePartyAggregatedRecord = {
  party_id: string;
  party_name: string;
  party_fate: PartyFate | null;
  party_fate_recorded_at: string | null;
  is_winner: boolean;
  deepest_floor: number;
  characters: {
    [characterId: string]: {
      character_id: string;
      character_name: string;
      level: number;
      combatant_class: string;
      id_of_controlling_user: number;
    };
  };
};

export class SanitizedRaceGameAggregatedRecord {
  game_id: string;
  game_name: string;
  game_version: string;
  time_of_completion: null | number;
  parties: {
    [partyName: string]: SanitizedRacePartyAggregatedRecord;
  } = {};
  constructor(gameRecord: RaceGameAggregatedRecord) {
    this.game_id = gameRecord.game_id;
    this.game_name = gameRecord.game_name;
    this.game_version = gameRecord.game_version;
    this.time_of_completion = gameRecord.time_of_completion;
  }
}

export class SanitizedRacePartyAggregatedRecord {
  party_id: string;
  party_name: string;
  party_fate: PartyFate | null;
  party_fate_recorded_at: string | null;
  is_winner: boolean;
  deepest_floor: number;
  characters: {
    [characterId: string]: {
      character_name: string;
      level: number;
      combatant_class: string;
      usernameOfControllingUser: string;
    };
  } = {};
  constructor(partyRecord: RacePartyAggregatedRecord) {
    this.party_id = partyRecord.party_id;
    this.party_name = partyRecord.party_name;
    this.party_fate = partyRecord.party_fate;
    this.party_fate_recorded_at = partyRecord.party_fate_recorded_at;
    this.is_winner = partyRecord.is_winner;
    this.deepest_floor = partyRecord.deepest_floor;
  }
}

export type SpeedDungeonProfile = {
  id: number;
  ownerId: number;
  characterCapacity: number;
  createdAt: number | Date;
  updatedAt: number | Date;
};

export class SanitizedProfile {
  createdAt: number;
  characterCapacity: number;
  constructor(profile: SpeedDungeonProfile) {
    this.createdAt = +profile.createdAt;
    this.characterCapacity = +profile.characterCapacity;
  }
}

export type ProfileCharacterRanks = {
  [id: string]: { name: string; level: number; rank: number | null; class: CombatantClass };
};
