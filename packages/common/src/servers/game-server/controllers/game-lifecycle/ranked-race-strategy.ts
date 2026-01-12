import { AdventuringParty } from "../../../../adventuring-party/index.js";
import { CombatantId } from "../../../../aliases.js";
import { ERROR_MESSAGES } from "../../../../errors/index.js";
import { SpeedDungeonGame } from "../../../../game/index.js";
import { SpeedDungeonPlayer } from "../../../../game/player.js";
import { RaceGameRecordsService } from "../../../services/race-game-records.js";
import { GameModeStrategy } from "./game-mode-strategy.js";
import { PartyFate } from "./record-types.js";

export class RankedRaceStrategy implements GameModeStrategy {
  constructor(private raceGameRecordsService: RaceGameRecordsService) {}

  async onBattleResult(_game: SpeedDungeonGame, _party: AdventuringParty) {
    return;
  }

  async onGameStart(game: SpeedDungeonGame) {
    if (!game.isRanked) {
      return;
    }
    await this.raceGameRecordsService.insertGameRecord(game);
  }

  async onGameLeave(
    game: SpeedDungeonGame,
    partyOption: undefined | AdventuringParty,
    player: SpeedDungeonPlayer
  ) {
    if (!game.timeStarted || !game.isRanked) {
      return [];
    }
    if (!partyOption) {
      throw new Error(ERROR_MESSAGES.GAME.PARTY_DOES_NOT_EXIST);
    }

    await this.updateRaceGameCharacterRecordLevels(partyOption, player.username);
    return [];
  }

  async onLastPlayerLeftGame(game: SpeedDungeonGame) {
    if (!game.isRanked) {
      return;
    }
    await this.raceGameRecordsService.markGameCompleted(game.id);
  }

  async onPartyWipe(game: SpeedDungeonGame, party: AdventuringParty) {
    if (!game.isRanked) {
      return [];
    }

    const partyRecord = await this.raceGameRecordsService.getExpectedPartyRecord(party.id);

    if (partyRecord.partyFate !== null) {
      return [];
    }

    await this.updateRaceGameCharacterRecordLevels(party);

    partyRecord.partyFate = PartyFate.Wipe;
    partyRecord.partyFateRecordedAt = new Date(Date.now()).toISOString();

    const floorNumber = party.dungeonExplorationManager.getCurrentFloor();
    partyRecord.deepestFloor = floorNumber;
    await this.raceGameRecordsService.applyUpdatedPartyRecord(partyRecord);

    let allPartiesAreDead = true;
    for (const party of Object.values(game.adventuringParties)) {
      if (party.timeOfWipe === null) {
        allPartiesAreDead = false;
        break;
      }
    }

    if (allPartiesAreDead) {
      await this.raceGameRecordsService.markGameCompleted(game.id);
    }

    return [];

    // @TODO - if there is only one party left, tell them they are the last ones left alive
    // but they must escape to claim victory
  }

  async onPartyVictory(
    _game: SpeedDungeonGame,
    _party: AdventuringParty,
    _levelups: Record<CombatantId, number>
  ) {
    // we only care if they escape, die or disconnect
    return [];
  }

  async onPartyEscape(game: SpeedDungeonGame, party: AdventuringParty) {
    if (!game.isRanked) {
      return;
    }

    await this.updateRaceGameCharacterRecordLevels(party);
    const partyRecord = await this.raceGameRecordsService.getExpectedPartyRecord(party.id);
    if (partyRecord.partyFate !== null) {
      return;
    }
    partyRecord.partyFate = PartyFate.Escape;
    partyRecord.partyFateRecordedAt = new Date(Date.now()).toISOString();

    const floorNumber = party.dungeonExplorationManager.getCurrentFloor();
    partyRecord.deepestFloor = floorNumber;

    const gameRecord = await this.raceGameRecordsService.findAggregatedGameRecordById(game.id);
    if (!gameRecord) {
      throw new Error(ERROR_MESSAGES.GAME_RECORDS.NOT_FOUND);
    }
    let gameAlreadyHasWinner = false;

    for (const party of Object.values(gameRecord.parties)) {
      if (party.is_winner) {
        gameAlreadyHasWinner = true;
        break;
      }
    }

    if (!gameAlreadyHasWinner) {
      partyRecord.isWinner = true;
      await this.raceGameRecordsService.markGameCompleted(game.id);
    }

    await this.raceGameRecordsService.applyUpdatedPartyRecord(partyRecord);
    return;
  }

  private async updateRaceGameCharacterRecordLevels(
    party: AdventuringParty,
    onlyForUsername: null | string = null
  ) {
    try {
      const partyCharacters = party.combatantManager.getPartyMemberCharacters();
      for (const character of partyCharacters) {
        if (onlyForUsername !== null) {
          const { controllerPlayerName } = character.combatantProperties.controlledBy;
          const userControlsThisCharacter = controllerPlayerName === onlyForUsername;
          if (!userControlsThisCharacter) continue;
        }
        await this.raceGameRecordsService.updateCharacterRecord(character);
      }
    } catch (error) {
      return error as unknown as Error;
    }
  }
}
