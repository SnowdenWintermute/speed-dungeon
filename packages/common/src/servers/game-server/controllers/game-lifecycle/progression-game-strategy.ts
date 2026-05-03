import { AdventuringParty } from "../../../../adventuring-party/index.js";
import { EntityId } from "../../../../aliases.js";
import { MAX_LADDER_RANK_GLOBAL_MESSAGE_THRESHOLD } from "../../../../app-consts.js";
import { Combatant } from "../../../../combatants/index.js";
import { SpeedDungeonGame } from "../../../../game/index.js";
import { SpeedDungeonPlayer } from "../../../../game/player.js";
import { LADDER_UPDATES_CHANNEL_NAME, getPartyChannelName } from "../../../../packets/channels.js";
import {
  GameMessageType,
  createLadderDeathsMessage,
  createLevelLadderExpRankMessage,
  createLevelLadderLevelupMessage,
} from "../../../../packets/game-message.js";
import { GameStateUpdate } from "../../../../packets/game-state-updates.js";
import { RankedLadderService } from "../../../services/ranked-ladder.js";
import { SavedCharactersService } from "../../../services/saved-characters.js";
import { MessageDispatchFactory } from "../../../update-delivery/message-dispatch-factory.js";
import { MessageDispatchOutbox } from "../../../update-delivery/outbox.js";
import { PartyDelayedGameMessageFactory } from "../../party-delayed-game-message-factory.js";
import { GameModeStrategy } from "./game-mode-strategy.js";

export class ProgressionGameStrategy implements GameModeStrategy {
  private readonly partyDelayedGameMessageFactory: PartyDelayedGameMessageFactory;
  constructor(
    private readonly savedCharactersService: SavedCharactersService,
    private readonly rankedLadderService: RankedLadderService,
    private readonly updateDispatchFactory: MessageDispatchFactory<GameStateUpdate>
  ) {
    this.partyDelayedGameMessageFactory = new PartyDelayedGameMessageFactory(
      this.updateDispatchFactory
    );
  }
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
      await this.rankedLadderService.getTopRankedDeathMessagesActionCommandPayload(
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

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    for (const [characterName, deathAndRank] of Object.entries(ladderDeathsUpdate)) {
      outbox.pushFromOther(
        this.partyDelayedGameMessageFactory.createMessageInChannelWithOptionalDelayForParty(
          game.getChannelName(),
          GameMessageType.LadderProgress,
          createLadderDeathsMessage(
            characterName,
            deathAndRank.owner,
            deathAndRank.level,
            deathAndRank.rank
          ),
          getPartyChannelName(game.name, party.name)
        )
      );
    }

    return outbox;
  }

  async onPartyVictory(
    game: SpeedDungeonGame,
    party: AdventuringParty,
    levelups: Record<EntityId, number>
  ): Promise<MessageDispatchOutbox<GameStateUpdate>> {
    const partyCharacters = party.combatantManager.getPartyMemberCharacters();

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);

    for (const character of partyCharacters) {
      const { classProgressionProperties } = character.combatantProperties;
      const totalExp = classProgressionProperties.totalExperiencePoints;

      const { id } = character.entityProperties;
      const { previousRank, newRank } =
        await this.rankedLadderService.updateOrCreateCharacterLevelEntry(id, totalExp);

      if (newRank === previousRank || newRank >= MAX_LADDER_RANK_GLOBAL_MESSAGE_THRESHOLD) {
        // not interesting enough to tell anyone about it
        continue;
      }
      // but if they ranked up and were in the top 10 ranks, emit a message to everyone

      const { name } = character.entityProperties;
      const { controlledBy } = character.combatantProperties;
      const controllingPlayer = controlledBy.controllerPlayerName;

      const levelup = levelups[id];
      if (levelup !== undefined) {
        outbox.pushFromOther(
          this.partyDelayedGameMessageFactory.createMessageInChannelWithOptionalDelayForParty(
            LADDER_UPDATES_CHANNEL_NAME,
            GameMessageType.LadderProgress,
            createLevelLadderLevelupMessage(name, controllingPlayer || "", levelup, newRank),
            getPartyChannelName(game.name, party.name)
          )
        );
      }
      outbox.pushFromOther(
        this.partyDelayedGameMessageFactory.createMessageInChannelWithOptionalDelayForParty(
          LADDER_UPDATES_CHANNEL_NAME,
          GameMessageType.LadderProgress,
          createLevelLadderExpRankMessage(
            name,
            controllingPlayer || "",
            character.combatantProperties.classProgressionProperties.experiencePoints.getCurrent(),
            newRank
          ),
          getPartyChannelName(game.name, party.name)
        )
      );
    }

    return outbox;
  }
}
