import { LADDER_CONFIG } from "../../app-consts.js";
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
  FloorClearEntry,
  PlayerProfileData,
  WinLossTally,
  WinRateEntry,
} from "./ladder-records-persistence-strategy.js";
import { LadderPage } from "../queries/ladder-page.js";
import { FloorClearCharacter, FloorClearTimesQuery } from "../queries/floor-clear-times.js";
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

// convenience over the whole record bag, used by the in-memory strategy where everything is already
// in RAM. the Postgres strategy instead composes the pieces below (computeRankedRaceTally +
// selectPersonalBestPartyFloorClears + assemblePersonalBestEntries) so it can load the heavy
// snapshot blobs only for the user's actual personal-best clears, never for rival parties.
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
  const userPartyIds = new Set(
    records.characters
      .filter((character) => character.controllingPlayerId === userId)
      .map((character) => character.partyRecordId)
  );
  const userPartyFloorClears = records.partyFloorClears.filter((partyFloorClear) =>
    userPartyIds.has(partyFloorClear.partyRecordRef)
  );
  const bests = selectPersonalBestPartyFloorClears(
    userPartyFloorClears,
    records.parties,
    records.games
  );
  const personalBestFloorClears = assemblePersonalBestEntries(bests, {
    parties: records.parties,
    games: records.games,
    characters: records.characters,
    snapshots: records.snapshots,
    partyClearHistory: records.partyFloorClears,
  });
  return { participantId: userId, rankedRaceTally, personalBestFloorClears };
}

// the user's fastest clear per (floor, mode, control scheme), sorted by floor. inputs are expected
// to be pre-scoped to the user's own clears — this does not itself check party membership.
export function selectPersonalBestPartyFloorClears(
  userPartyFloorClears: LadderPartyFloorClearRecord[],
  parties: LadderPartyRecord[],
  games: LadderGameRecord[]
): LadderPartyFloorClearRecord[] {
  const partiesById = new Map(parties.map((party) => [party.id, party]));
  const gamesById = new Map(games.map((game) => [game.id, game]));
  const bestByFloorModeScheme = new Map<string, LadderPartyFloorClearRecord>();

  for (const partyFloorClear of userPartyFloorClears) {
    const party = partiesById.get(partyFloorClear.partyRecordRef);
    const game = party === undefined ? undefined : gamesById.get(party.gameRecordId);
    if (game === undefined) {
      continue;
    }
    const key = `${partyFloorClear.floor}:${game.mode}:${partyFloorClear.controlScheme}`;
    const current = bestByFloorModeScheme.get(key);
    if (current === undefined || partyFloorClear.timeSpentOnFloor < current.timeSpentOnFloor) {
      bestByFloorModeScheme.set(key, partyFloorClear);
    }
  }

  return [...bestByFloorModeScheme.values()].sort((a, b) => a.floor - b.floor);
}

// assembles the display entries for an already-selected, floor-sorted set of best clears. rank here
// is the floor-order position within the personal-best list, not a global ladder rank.
export function assemblePersonalBestEntries(
  bestPartyFloorClears: LadderPartyFloorClearRecord[],
  records: {
    parties: LadderPartyRecord[];
    games: LadderGameRecord[];
    characters: LadderCharacterRecord[];
    snapshots: LadderCharacterFloorClearRecord[];
    // the best clears' parties' full clear history (floors <= each best), for cumulativeTimeToClearFloor
    partyClearHistory: LadderPartyFloorClearRecord[];
  }
): FloorClearEntry[] {
  const indexes = indexFloorClearRecords({
    partyFloorClears: records.partyClearHistory,
    parties: records.parties,
    games: records.games,
    characters: records.characters,
    snapshots: records.snapshots,
  });
  return bestPartyFloorClears.map((partyFloorClear, index) =>
    assembleFloorClearEntry(partyFloorClear, index + 1, indexes)
  );
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

interface FloorClearIndexes {
  partiesById: Map<PartyId, LadderPartyRecord>;
  gamesById: Map<GameId, LadderGameRecord>;
  charactersByParty: Map<PartyId, LadderCharacterRecord[]>;
  partyFloorClearsByParty: Map<PartyId, LadderPartyFloorClearRecord[]>;
  snapshots: LadderCharacterFloorClearRecord[];
}

function indexFloorClearRecords(records: FloorClearProjectionRecords): FloorClearIndexes {
  const charactersByParty = new Map<PartyId, LadderCharacterRecord[]>();
  for (const character of records.characters) {
    const forParty = charactersByParty.get(character.partyRecordId) ?? [];
    forParty.push(character);
    charactersByParty.set(character.partyRecordId, forParty);
  }
  const partyFloorClearsByParty = new Map<PartyId, LadderPartyFloorClearRecord[]>();
  for (const partyFloorClear of records.partyFloorClears) {
    const forParty = partyFloorClearsByParty.get(partyFloorClear.partyRecordRef) ?? [];
    forParty.push(partyFloorClear);
    partyFloorClearsByParty.set(partyFloorClear.partyRecordRef, forParty);
  }
  return {
    partiesById: new Map(records.parties.map((party) => [party.id, party])),
    gamesById: new Map(records.games.map((game) => [game.id, game])),
    charactersByParty,
    partyFloorClearsByParty,
    snapshots: records.snapshots,
  };
}

// active time from game start through clearing the given floor: sum of timeSpentOnFloor over the
// party's clears on floors <= this one. floors 1..X are expected to all be present (an invariant — a
// gap means a floor clear went unrecorded, i.e. a write-path bug); we sum whatever exists.
function cumulativeTimeToClearFloor(
  partyFloorClear: LadderPartyFloorClearRecord,
  indexes: FloorClearIndexes
): number {
  const partyClears = indexes.partyFloorClearsByParty.get(partyFloorClear.partyRecordRef) ?? [];
  return partyClears
    .filter((clear) => clear.floor <= partyFloorClear.floor)
    .reduce((total, clear) => total + clear.timeSpentOnFloor, 0);
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

  const characters: FloorClearCharacter[] = partyCharacters.map((character) => {
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

  const players = [...new Set(partyCharacters.map((character) => character.controllingPlayerId))];

  return {
    rank,
    gameRecordId: game.id,
    partyRecordId: party.id,
    partyName: party.name,
    mode: game.mode,
    controlScheme: partyFloorClear.controlScheme,
    floor: partyFloorClear.floor,
    timeSpentOnFloor: partyFloorClear.timeSpentOnFloor,
    cumulativeTimeToClearFloor: cumulativeTimeToClearFloor(partyFloorClear, indexes),
    // floor-clear records store no absolute per-floor timestamp; the run's start date is the
    // display "date". see notes for why we don't derive a wall-clock clear time here.
    gameStartedAt: game.timeStarted,
    players,
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
  const totalPages = Math.ceil(all.length / LADDER_CONFIG.PAGE_SIZE);
  const pageStart = page * LADDER_CONFIG.PAGE_SIZE;
  const pageSources = all.slice(pageStart, pageStart + LADDER_CONFIG.PAGE_SIZE);
  const entries = pageSources.map((source, indexInPage) =>
    toEntry(source, pageStart + indexInPage + 1)
  );
  return { page, totalPages, entries };
}
