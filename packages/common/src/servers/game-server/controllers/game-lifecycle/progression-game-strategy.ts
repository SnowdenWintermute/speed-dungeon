import { ActionCommandPayload, ActionCommandType } from "../../../../action-processing/index.js";
import { AdventuringParty } from "../../../../adventuring-party/index.js";
import { EntityId } from "../../../../aliases.js";
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

export class ProgressionGameStrategy implements GameModeStrategy {
  constructor(
    private readonly savedCharactersService: SavedCharactersService,
    private readonly rankedLadderService: RankedLadderService
  ) {}
  async onGameStart(_game: SpeedDungeonGame) {
    // we don't need to do anything unless their character changes
    return Promise.resolve();
  }

  async onBattleResult(game: SpeedDungeonGame, party: AdventuringParty) {
    await this.savedCharactersService.updateAllInParty(game, party);
  }

  async onGameLeave(game: SpeedDungeonGame, party: AdventuringParty, player: SpeedDungeonPlayer) {
    const characters: Combatant[] = [];

    for (const id of player.characterIds) {
      const characterResult = game.getExpectedCombatant(id);
      characters.push(characterResult);
    }

    await this.savedCharactersService.updateAllInParty(game, party);

    // If they're leaving a game while dead, this character should be removed from the ladder
    const deathsAndRanks = await this.rankedLadderService.removeDeadCharacters(characters);
    const deathMessagePayloads =
      this.rankedLadderService.getTopRankedDeathMessagesActionCommandPayload(
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
    const ladderDeathsUpdate = await this.rankedLadderService.removeDeadCharacters(partyCharacters);
    const deathMessagePayloads =
      this.rankedLadderService.getTopRankedDeathMessagesActionCommandPayload(
        getPartyChannelName(game.name, party.name),
        ladderDeathsUpdate
      );
    return [deathMessagePayloads];
  }

  async onPartyVictory(
    game: SpeedDungeonGame,
    party: AdventuringParty,
    levelups: Record<EntityId, number>
  ): Promise<ActionCommandPayload[]> {
    const partyCharacters = party.combatantManager.getPartyMemberCharacters();

    const messages: GameMessage[] = [];

    for (const character of partyCharacters) {
      const { classProgressionProperties } = character.combatantProperties;
      const totalExp = classProgressionProperties.totalExperiencePoints;

      const { id } = character.entityProperties;
      const { previousRank, newRank } =
        await this.rankedLadderService.updateOrCreateCharacterLevelEntry(id, totalExp);

      if (newRank === previousRank || newRank >= 10) {
        // not interesting enough to tell anyone about it
        continue;
      }

      const { name } = character.entityProperties;
      const { controlledBy } = character.combatantProperties;
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

      // but if they ranked up and were in the top 10 ranks, emit a message to everyone
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
