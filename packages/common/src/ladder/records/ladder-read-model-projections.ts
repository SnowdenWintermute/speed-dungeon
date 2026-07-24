import { LADDER_PAGE_SIZE } from "../../app-consts.js";
import { CombatantId, GameId, IdentityProviderId, PartyId } from "../../aliases.js";
import { CharacterControlScheme, GameMode } from "../../game-modes/index.js";
import {
  LadderCharacterFloorClearRecord,
  LadderCharacterRecord,
  LadderGameRecord,
  LadderPartyFloorClearRecord,
  LadderPartyRecord,
  PartyFateType,
} from "./index.js";
import {
  ExperiencePointsLadderCharacterEntry,
  FloorClearCharacterEntry,
  FloorClearEntry,
  PlayerProfileData,
  WinLossTally,
  WinRateEntry,
} from "./ladder-records-persistence-strategy.js";
import { LadderPage } from "../queries/ladder-page.js";
import { FloorClearTimesQuery } from "../queries/floor-clear-times.js";
import { WinRateLadderQuery } from "../queries/win-rate-ladder.js";
import { CharacterFloorClearSnapshotView } from "../queries/character-floor-clear-snapshot.js";

// pure read-side projections shared by every LadderRecordsPersistenceStrategy implementation. each
// takes plain record arrays (the adapter loads them however it likes — Maps, SQL) and returns the
// id-keyed …Entry read models. keeping the subtle bits (race-winner resolution, win/loss tallying,
// personal-best grouping) here means the in-memory and Postgres strategies can never diverge on them.

export interface FloorClearProjectionRecords {
  partyFloorClears: LadderPartyFloorClearRecord[];
  parties: LadderPartyRecord[];
  games: LadderGameRecord[];
  characters: LadderCharacterRecord[];
  snapshots: LadderCharacterFloorClearRecord[];
}

export function projectFloorClearTimesPage(
  query: FloorClearTimesQuery,
  records: FloorClearProjectionRecords
): LadderPage<FloorClearEntry> {
  const indexes = indexFloorClearRecords(records);

  const matching = records.partyFloorClears.filter((partyFloorClear) => {
    if (partyFloorClear.floor !== query.floor) {
      return false;
    }
    if (
      query.controlSchemeOption !== undefined &&
      partyFloorClear.controlScheme !== query.controlSchemeOption
    ) {
      return false;
    }
    const game = gameForPartyFloorClear(partyFloorClear, indexes);
    if (game === undefined) {
      return false;
    }
    return query.modeOption === undefined || game.mode === query.modeOption;
  });

  matching.sort((a, b) => a.timeSpentOnFloor - b.timeSpentOnFloor);

  return paginate(matching, query.page, (partyFloorClear, rank) =>
    assembleFloorClearEntry(partyFloorClear, rank, indexes)
  );
}

export function projectWinRateLadderPage(
  query: WinRateLadderQuery,
  records: {
    participantIds: IdentityProviderId[];
    games: LadderGameRecord[];
    parties: LadderPartyRecord[];
    characters: LadderCharacterRecord[];
  }
): LadderPage<WinRateEntry> {
  const tallied = records.participantIds
    .map((participantId) => ({
      participantId,
      tally: computeRankedRaceTally(
        participantId,
        records.games,
        records.parties,
        records.characters,
        query.controlSchemeOption
      ),
    }))
    .filter((entry) => entry.tally.gamesPlayed >= query.minimumGamesPlayed);

  tallied.sort(
    (a, b) => winRateOf(b.tally) - winRateOf(a.tally) || b.tally.gamesPlayed - a.tally.gamesPlayed
  );

  return paginate(tallied, query.page, (entry, rank) => ({
    rank,
    participantId: entry.participantId,
    tally: entry.tally,
  }));
}

export function projectPlayerProfileData(
  userId: IdentityProviderId,
  records: FloorClearProjectionRecords & { isKnownParticipant: boolean }
): PlayerProfileData | undefined {
  if (!records.isKnownParticipant) {
    return undefined;
  }
  const rankedRaceTally = computeRankedRaceTally(
    userId,
    records.games,
    records.parties,
    records.characters
  );
  const personalBestFloorClears = projectPersonalBestFloorClears(userId, records);
  return { participantId: userId, rankedRaceTally, personalBestFloorClears };
}

export function projectExperiencePointsLadderCharacters(
  characterIds: CombatantId[],
  records: {
    characters: LadderCharacterRecord[];
    parties: LadderPartyRecord[];
    games: LadderGameRecord[];
  }
): ExperiencePointsLadderCharacterEntry[] {
  const charactersById = new Map(records.characters.map((character) => [character.id, character]));
  const partiesById = new Map(records.parties.map((party) => [party.id, party]));
  const gamesById = new Map(records.games.map((game) => [game.id, game]));

  const entries: ExperiencePointsLadderCharacterEntry[] = [];
  for (const characterId of characterIds) {
    const character = charactersById.get(characterId);
    if (character === undefined) {
      continue;
    }
    const party = partiesById.get(character.partyRecordId);
    if (party === undefined) {
      continue;
    }
    const game = gamesById.get(party.gameRecordId);
    if (game === undefined) {
      continue;
    }
    entries.push({
      characterId: character.id,
      characterName: character.name,
      ownerId: character.controllingPlayerId,
      mainClass: { ...character.mainClass },
      supportClassOption:
        character.supportClassOption === undefined
          ? undefined
          : { ...character.supportClassOption },
      mode: game.mode,
      controlScheme: game.controlScheme,
    });
  }
  return entries;
}

export function projectCharacterFloorClearSnapshot(
  snapshot: LadderCharacterFloorClearRecord | undefined,
  characterName: string
): CharacterFloorClearSnapshotView | undefined {
  if (snapshot === undefined) {
    return undefined;
  }
  return {
    id: snapshot.id,
    characterRecordId: snapshot.characterRecordRef,
    characterName,
    combatantSchemaVersion: snapshot.combatantSchemaVersion,
    combatantWithPets: snapshot.combatantWithPets,
  };
}

// race winner(s) = the party (or tied parties) with the earliest escape timestamp in the game
export function raceWinnerPartyIds(parties: LadderPartyRecord[], gameId: GameId): Set<PartyId> {
  const escaped: { id: PartyId; timestamp: number }[] = [];
  for (const party of parties) {
    if (party.gameRecordId !== gameId) {
      continue;
    }
    const fate = party.fateOption;
    if (fate !== undefined && fate.type === PartyFateType.Escape) {
      escaped.push({ id: party.id, timestamp: fate.timestamp });
    }
  }
  if (escaped.length === 0) {
    return new Set();
  }
  const earliest = Math.min(...escaped.map((entry) => entry.timestamp));
  return new Set(escaped.filter((entry) => entry.timestamp === earliest).map((entry) => entry.id));
}

export function computeRankedRaceTally(
  userId: IdentityProviderId,
  games: LadderGameRecord[],
  parties: LadderPartyRecord[],
  characters: LadderCharacterRecord[],
  controlSchemeOption?: CharacterControlScheme
): WinLossTally {
  let wins = 0;
  let gamesPlayed = 0;
  for (const game of games) {
    if (game.mode !== GameMode.RankedRace) {
      continue;
    }
    if (controlSchemeOption !== undefined && game.controlScheme !== controlSchemeOption) {
      continue;
    }
    const party = playerPartyInGame(game.id, userId, parties, characters);
    if (party === undefined || party.fateOption === undefined) {
      continue;
    }
    gamesPlayed += 1;
    if (raceWinnerPartyIds(parties, game.id).has(party.id)) {
      wins += 1;
    }
  }
  return { wins, losses: gamesPlayed - wins, gamesPlayed };
}

function projectPersonalBestFloorClears(
  userId: IdentityProviderId,
  records: FloorClearProjectionRecords
): FloorClearEntry[] {
  const indexes = indexFloorClearRecords(records);
  const bestByFloorModeScheme = new Map<string, LadderPartyFloorClearRecord>();

  for (const partyFloorClear of records.partyFloorClears) {
    const game = gameForPartyFloorClear(partyFloorClear, indexes);
    if (game === undefined) {
      continue;
    }
    const partyCharacters = indexes.charactersByParty.get(partyFloorClear.partyRecordRef) ?? [];
    const userIsInParty = partyCharacters.some(
      (character) => character.controllingPlayerId === userId
    );
    if (!userIsInParty) {
      continue;
    }
    const key = `${partyFloorClear.floor}:${game.mode}:${partyFloorClear.controlScheme}`;
    const current = bestByFloorModeScheme.get(key);
    if (current === undefined || partyFloorClear.timeSpentOnFloor < current.timeSpentOnFloor) {
      bestByFloorModeScheme.set(key, partyFloorClear);
    }
  }

  return [...bestByFloorModeScheme.values()]
    .sort((a, b) => a.floor - b.floor)
    .map((partyFloorClear, index) => assembleFloorClearEntry(partyFloorClear, index + 1, indexes));
}

interface FloorClearIndexes {
  partiesById: Map<PartyId, LadderPartyRecord>;
  gamesById: Map<GameId, LadderGameRecord>;
  charactersByParty: Map<PartyId, LadderCharacterRecord[]>;
  snapshots: LadderCharacterFloorClearRecord[];
}

function indexFloorClearRecords(records: FloorClearProjectionRecords): FloorClearIndexes {
  const charactersByParty = new Map<PartyId, LadderCharacterRecord[]>();
  for (const character of records.characters) {
    const forParty = charactersByParty.get(character.partyRecordId) ?? [];
    forParty.push(character);
    charactersByParty.set(character.partyRecordId, forParty);
  }
  return {
    partiesById: new Map(records.parties.map((party) => [party.id, party])),
    gamesById: new Map(records.games.map((game) => [game.id, game])),
    charactersByParty,
    snapshots: records.snapshots,
  };
}

function gameForPartyFloorClear(
  partyFloorClear: LadderPartyFloorClearRecord,
  indexes: FloorClearIndexes
): LadderGameRecord | undefined {
  const party = indexes.partiesById.get(partyFloorClear.partyRecordRef);
  if (party === undefined) {
    return undefined;
  }
  return indexes.gamesById.get(party.gameRecordId);
}

function assembleFloorClearEntry(
  partyFloorClear: LadderPartyFloorClearRecord,
  rank: number,
  indexes: FloorClearIndexes
): FloorClearEntry {
  const party = indexes.partiesById.get(partyFloorClear.partyRecordRef);
  const game = party === undefined ? undefined : indexes.gamesById.get(party.gameRecordId);
  // callers only assemble entries for floor clears that passed the game-resolution filter
  if (party === undefined || game === undefined) {
    throw new Error("cannot assemble a floor clear entry without its party and game");
  }

  const partyCharacters = indexes.charactersByParty.get(party.id) ?? [];

  const characters: FloorClearCharacterEntry[] = partyCharacters.map((character) => {
    const snapshot = indexes.snapshots.find(
      (candidate) =>
        candidate.partyFloorClearRecord === partyFloorClear.id &&
        candidate.characterRecordRef === character.id
    );
    return {
      characterId: character.id,
      characterName: character.name,
      snapshotIdOption: snapshot?.id,
    };
  });

  const playerIds = [...new Set(partyCharacters.map((character) => character.controllingPlayerId))];

  return {
    rank,
    gameRecordId: game.id,
    partyRecordId: party.id,
    partyName: party.name,
    mode: game.mode,
    controlScheme: partyFloorClear.controlScheme,
    floor: partyFloorClear.floor,
    timeSpentOnFloor: partyFloorClear.timeSpentOnFloor,
    // floor-clear records store no absolute clear timestamp; the run's start date is the display
    // "date". add a real clearedAt to LadderPartyFloorClearRecord if per-floor dating is needed.
    clearedAt: game.timeStarted,
    playerIds,
    characters,
  };
}

function playerPartyInGame(
  gameId: GameId,
  userId: IdentityProviderId,
  parties: LadderPartyRecord[],
  characters: LadderCharacterRecord[]
): LadderPartyRecord | undefined {
  const partiesById = new Map(parties.map((party) => [party.id, party]));
  for (const character of characters) {
    if (character.controllingPlayerId !== userId) {
      continue;
    }
    const party = partiesById.get(character.partyRecordId);
    if (party !== undefined && party.gameRecordId === gameId) {
      return party;
    }
  }
  return undefined;
}

function winRateOf(tally: WinLossTally): number {
  return tally.gamesPlayed === 0 ? 0 : tally.wins / tally.gamesPlayed;
}

function paginate<TSource, TEntry>(
  all: TSource[],
  page: number,
  toEntry: (source: TSource, rank: number) => TEntry
): LadderPage<TEntry> {
  const totalPages = Math.ceil(all.length / LADDER_PAGE_SIZE);
  const pageStart = page * LADDER_PAGE_SIZE;
  const pageSources = all.slice(pageStart, pageStart + LADDER_PAGE_SIZE);
  const entries = pageSources.map((source, indexInPage) =>
    toEntry(source, pageStart + indexInPage + 1)
  );
  return { page, totalPages, entries };
}
