import { CombatantId, EntityName, GameName, PartyName } from "../../../../aliases.js";

export interface LevelLadderEntry {
  owner: string;
  characterName: string;
  characterId: string;
  level: number;
  experience: number;
  rank: number;
  gameVersion: string;
}

export enum PartyFate {
  Wipe = "wipe",
  Escape = "escape",
}

export interface RaceGameAggregatedRecord {
  game_id: string;
  game_name: GameName;
  game_version: string;
  time_of_completion: null | number;
  parties: Record<PartyName, RacePartyAggregatedRecord>;
}

export interface RacePartyAggregatedRecord {
  party_id: string;
  party_name: PartyName;
  party_fate: PartyFate | null;
  party_fate_recorded_at: string | null;
  is_winner: boolean;
  deepest_floor: number;
  characters: Record<
    CombatantId,
    {
      character_id: CombatantId;
      character_name: EntityName;
      level: number;
      combatant_class: string;
      id_of_controlling_user: number;
    }
  >;
}

export class SanitizedRaceGameAggregatedRecord {
  game_id: string;
  game_name: GameName;
  game_version: string;
  time_of_completion: null | number;
  parties: Record<PartyName, SanitizedRacePartyAggregatedRecord> = {};
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
  characters: Record<
    CombatantId,
    {
      character_name: string;
      level: number;
      combatant_class: string;
      usernameOfControllingUser: string;
    }
  > = {};
  constructor(partyRecord: RacePartyAggregatedRecord) {
    this.party_id = partyRecord.party_id;
    this.party_name = partyRecord.party_name;
    this.party_fate = partyRecord.party_fate;
    this.party_fate_recorded_at = partyRecord.party_fate_recorded_at;
    this.is_winner = partyRecord.is_winner;
    this.deepest_floor = partyRecord.deepest_floor;
  }
}
