import { ActionCommandType } from "../../../../action-processing/index.js";
import { AdventuringParty } from "../../../../adventuring-party/index.js";
import { EntityId } from "../../../../aliases.js";
import { calculateTotalExperience } from "../../../../combatants/experience-points/calculate-total-experience.js";
import { Combatant } from "../../../../combatants/index.js";
import { SpeedDungeonGame } from "../../../../game/index.js";
import { SpeedDungeonPlayer } from "../../../../game/player.js";
import { getPartyChannelName } from "../../../../packets/channels.js";
import {
  GameMessage,
  GameMessageType,
  createLevelLadderExpRankMessage,
  createLevelLadderLevelupMessage,
} from "../../../../packets/game-message.js";
import { RankedLadderService } from "../../../services/ranked-ladder.js";
import { SavedCharactersService } from "../../../services/saved-characters.js";
import { GameModeStrategy } from "./game-mode-strategy.js";

export default class ProgressionGameStrategy implements GameModeStrategy {
  constructor(
    private readonly savedCharactersService: SavedCharactersService,
    private readonly rankedLadderService: RankedLadderService
  ) {}
  async onGameStart(_game: SpeedDungeonGame) {
    // we don't need to do anything unless their character changes
    return Promise.resolve();
  }

  async onBattleResult(game: SpeedDungeonGame, _party: AdventuringParty) {
    await this.savedCharactersService.writeAllPlayerCharacterInGameToDb(getGameServer(), game);
  }

  async onGameLeave(game: SpeedDungeonGame, party: AdventuringParty, player: SpeedDungeonPlayer) {
    const characters: Combatant[] = [];

    for (const id of player.characterIds) {
      const characterResult = game.getCombatantById(id);
      if (characterResult instanceof Error) return characterResult;
      characters.push(characterResult);

      delete game.lowestStartingFloorOptionsBySavedCharacter[id];
    }

    if (!game.timeStarted) return;

    const maybeError = await writePlayerCharactersInGameToDb(game, player);
    if (maybeError instanceof Error) return maybeError;
    // If they're leaving a game while dead, this character should be removed from the ladder

    const deathsAndRanks = await removeDeadCharactersFromLadder(characters);
    const deathMessagePayloads = getTopRankedDeathMessagesActionCommandPayload(
      getPartyChannelName(game.name, party.name),
      deathsAndRanks
    );
    return [deathMessagePayloads];
  }

  onLastPlayerLeftGame(_game: SpeedDungeonGame) {
    return Promise.resolve();
  }

  onPartyEscape(_game: SpeedDungeonGame, _party: AdventuringParty) {
    return Promise.resolve();
  }

  async onPartyWipe(game: SpeedDungeonGame, party: AdventuringParty) {
    const partyCharacters = party.combatantManager.getPartyMemberCharacters();
    const ladderDeathsUpdate = await removeDeadCharactersFromLadder(partyCharacters);
    const deathMessagePayloads = getTopRankedDeathMessagesActionCommandPayload(
      getPartyChannelName(game.name, party.name),
      ladderDeathsUpdate
    );
    return [deathMessagePayloads];
  }

  async onPartyVictory(
    game: SpeedDungeonGame,
    party: AdventuringParty,
    levelups: Record<EntityId, number>
  ) {
    const partyCharacters = party.combatantManager.getPartyMemberCharacters();

    const messages: GameMessage[] = [];

    for (const character of partyCharacters) {
      const { name, id } = character.entityProperties;

      const { level } = character.combatantProperties.classProgressionProperties.getMainClass();
      const { controlledBy } = character.combatantProperties;
      const currentRankOption = await valkeyManager.context.zRevRank(CHARACTER_LEVEL_LADDER, id);
      const totalExp =
        calculateTotalExperience(level) +
        character.combatantProperties.classProgressionProperties.experiencePoints.getCurrent();
      await valkeyManager.context.zAdd(CHARACTER_LEVEL_LADDER, [
        {
          value: id,
          score: totalExp,
        },
      ]);
      const newRank = await valkeyManager.context.zRevRank(CHARACTER_LEVEL_LADDER, id);

      // - if they leveled up and were in the top 10 ranks, emit a message to everyone
      if (newRank === null || newRank >= 10) continue;

      const controllingPlayer = controlledBy.controllerPlayerName;

      const levelup = levelups[id];
      if (levelup !== undefined) {
        messages.push(
          new GameMessage(
            GameMessageType.LadderProgress,
            true,
            createLevelLadderLevelupMessage(name, controllingPlayer || "", levelup, newRank)
          )
        );
      }

      // - if they ranked up and were in the top 10 ranks, emit a message to everyone
      if (newRank === currentRankOption || newRank >= 10) continue;
      messages.push(
        new GameMessage(
          GameMessageType.LadderProgress,
          true,
          createLevelLadderExpRankMessage(name, controllingPlayer || "", totalExp, newRank)
        )
      );
    }

    return [
      {
        type: ActionCommandType.GameMessages,
        messages,
        partyChannelToExclude: getPartyChannelName(game.name, party.name),
      },
    ];
  }
}
