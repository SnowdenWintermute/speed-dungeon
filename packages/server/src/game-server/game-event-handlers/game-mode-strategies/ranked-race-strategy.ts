import {
  AdventuringParty,
  ERROR_MESSAGES,
  PartyFate,
  SpeedDungeonGame,
  SpeedDungeonPlayer,
} from "@speed-dungeon/common";
import { GameModeStrategy } from "./index.js";
import { raceGameRecordsRepo } from "../../../database/repos/race-game-records.js";
import { raceGamePartyRecordsRepo } from "../../../database/repos/race-game-party-records.js";
import { raceGameCharacterRecordsRepo } from "../../../database/repos/race-game-character-records.js";

export default class RankedRaceStrategy implements GameModeStrategy {
  onBattleResult(_game: SpeedDungeonGame, _party: AdventuringParty): Promise<Error | void> {
    return Promise.resolve();
  }
  onGameStart(game: SpeedDungeonGame): Promise<Error | void> {
    if (!game.isRanked) return Promise.resolve();
    return raceGameRecordsRepo.insertGameRecord(game);
  }
  async onGameLeave(
    game: SpeedDungeonGame,
    partyOption: undefined | AdventuringParty,
    player: SpeedDungeonPlayer
  ): Promise<Error | void> {
    if (!game.timeStarted || !game.isRanked) return Promise.resolve();
    if (!partyOption) return new Error(ERROR_MESSAGES.GAME.PARTY_DOES_NOT_EXIST);

    const maybeError = await updateRaceGameCharacterRecordLevels(partyOption, player.username);
    if (maybeError instanceof Error) return maybeError;

    return Promise.resolve();
  }

  onLastPlayerLeftGame(game: SpeedDungeonGame): Promise<Error | void> {
    if (!game.isRanked) return Promise.resolve();
    return raceGameRecordsRepo.markGameAsCompleted(game.id);
  }

  async onPartyWipe(game: SpeedDungeonGame, party: AdventuringParty): Promise<Error | void> {
    if (!game.isRanked) return Promise.resolve();
    if (!game.timeStarted) return new Error(ERROR_MESSAGES.GAME.NOT_STARTED);
    const maybeError = await updateRaceGameCharacterRecordLevels(party);
    if (maybeError instanceof Error) return maybeError;

    const partyRecord = await raceGamePartyRecordsRepo.findById(party.id);
    if (!partyRecord) return new Error(ERROR_MESSAGES.GAME_RECORDS.PARTY_RECORD_NOT_FOUND);
    if (partyRecord.partyFate) return Promise.resolve();

    partyRecord.partyFate = PartyFate.Wipe;
    partyRecord.partyFateRecordedAt = new Date(Date.now()).toISOString();
    partyRecord.deepestFloor = party.currentFloor;
    await raceGamePartyRecordsRepo.update(partyRecord);

    let allPartiesAreDead = true;
    for (const party of Object.values(game.adventuringParties)) {
      if (party.timeOfWipe === null) {
        allPartiesAreDead = false;
        break;
      }
    }

    if (allPartiesAreDead) await raceGameRecordsRepo.markGameAsCompleted(game.id);

    // @TODO - if there is only one party left, tell them they are the last ones left alive
    // but they must escape to claim victory
  }

  onPartyVictory(
    _game: SpeedDungeonGame,
    _party: AdventuringParty,
    _levelups: { [id: string]: number }
  ): Promise<void | Error> {
    // we only care if they escape, die or disconnect
    return Promise.resolve();
  }

  async onPartyEscape(game: SpeedDungeonGame, party: AdventuringParty): Promise<Error | void> {
    if (!game.isRanked) return Promise.resolve();
    if (!game.timeStarted) return new Error(ERROR_MESSAGES.GAME.NOT_STARTED);
    const maybeError = await updateRaceGameCharacterRecordLevels(party);
    if (maybeError instanceof Error) return maybeError;

    const partyRecord = await raceGamePartyRecordsRepo.findById(party.id);
    if (!partyRecord) return new Error(ERROR_MESSAGES.GAME_RECORDS.PARTY_RECORD_NOT_FOUND);
    if (partyRecord.partyFate) return Promise.resolve();
    partyRecord.partyFate = PartyFate.Escape;
    partyRecord.partyFateRecordedAt = new Date(Date.now()).toISOString();
    partyRecord.deepestFloor = party.currentFloor;

    const gameRecord = await raceGameRecordsRepo.findAggregatedGameRecordById(game.id);
    if (!gameRecord) return new Error(ERROR_MESSAGES.GAME_RECORDS.NOT_FOUND);
    let gameAlreadyHasWinner = false;

    for (const party of Object.values(gameRecord.parties)) {
      if (party.is_winner) {
        gameAlreadyHasWinner = true;
        break;
      }
    }

    if (!gameAlreadyHasWinner) {
      partyRecord.isWinner = true;
      await raceGameRecordsRepo.markGameAsCompleted(game.id);
    }

    await raceGamePartyRecordsRepo.update(partyRecord);
  }
}

async function updateRaceGameCharacterRecordLevels(
  party: AdventuringParty,
  onlyForUsername: null | string = null
) {
  try {
    for (const character of Object.values(party.characters)) {
      if (onlyForUsername && character.combatantProperties.controllingPlayer !== onlyForUsername)
        continue;
      await raceGameCharacterRecordsRepo.update(character);
    }
  } catch (error) {
    return error as unknown as Error;
  }
}
