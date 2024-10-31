import {
  AdventuringParty,
  ERROR_MESSAGES,
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
    if (!partyOption) return new Error(ERROR_MESSAGES.GAME.PARTY_DOES_NOT_EXIST);
    if (!game.timeStarted || !game.isRanked) return Promise.resolve();

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
    partyRecord.durationToWipe = Date.now() - game.timeStarted;
    console.log("set duration to wipe: ", partyRecord.durationToWipe);
    await raceGamePartyRecordsRepo.update(partyRecord);

    if (Object.keys(game.adventuringParties).length === 0)
      await raceGameRecordsRepo.markGameAsCompleted(game.id);

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
    partyRecord.durationToEscape = Date.now() - game.timeStarted;
    partyRecord.isWinner = true;
    await raceGamePartyRecordsRepo.update(partyRecord);

    await raceGameRecordsRepo.markGameAsCompleted(game.id);
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
