import { AdventuringParty } from "../../../../adventuring-party/index.js";
import { EntityId } from "../../../../aliases.js";
import { MAX_LADDER_RANK_GLOBAL_MESSAGE_THRESHOLD } from "../../../../app-consts.js";
import { Combatant } from "../../../../combatants/index.js";
import { SpeedDungeonGame } from "../../../../game/index.js";
import { SpeedDungeonPlayer } from "../../../../game/player.js";
import { LADDER_UPDATES_CHANNEL_NAME, getPartyChannelName } from "../../../../packets/channels.js";
import {
  GameMessage,
  GameMessageType,
  createLadderDeathsMessage,
  createLevelLadderExpRankMessage,
  createLevelLadderLevelupMessage,
} from "../../../../packets/game-message.js";
import { GameStateUpdate, GameStateUpdateType } from "../../../../packets/game-state-updates.js";
import {
  CrossServerBroadcasterService,
  CrossServerBroadcastType,
} from "../../../services/cross-server-broadcaster/index.js";
import { RankedLadderService } from "../../../services/ranked-ladder.js";
import { SavedCharactersService } from "../../../services/saved-characters.js";
import { ServerCommand } from "../../../services/server-command/index.js";
import { UserSessionRegistry } from "../../../sessions/user-session-registry.js";
import { MessageDispatchFactory } from "../../../update-delivery/message-dispatch-factory.js";
import { MessageDispatchOutbox } from "../../../update-delivery/outbox.js";
import { PartyDelayedGameMessageFactory } from "../../party-delayed-game-message-factory.js";
import { GameModeStrategy } from "./game-mode-strategy.js";

export class ProgressionGameStrategy implements GameModeStrategy {
  private readonly partyDelayedGameMessageFactory: PartyDelayedGameMessageFactory;
  constructor(
    private readonly savedCharactersService: SavedCharactersService,
    private readonly rankedLadderService: RankedLadderService,
    private readonly updateDispatchFactory: MessageDispatchFactory<GameStateUpdate>,
    private readonly crossServerBroadcasterService: CrossServerBroadcasterService<
      GameStateUpdate,
      ServerCommand
    >,
    private readonly userSessionRegistry: UserSessionRegistry
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
    const partyChannelName = getPartyChannelName(game.name, party.name);
    for (const [characterName, deathAndRank] of Object.entries(ladderDeathsUpdate)) {
      const ladderDeathMessageText = createLadderDeathsMessage(
        characterName,
        deathAndRank.owner,
        deathAndRank.level,
        deathAndRank.rank
      );
      outbox.pushFromOther(
        this.partyDelayedGameMessageFactory.createMessageInChannelWithOptionalDelayForParty(
          partyChannelName,
          GameMessageType.LadderDeath,
          ladderDeathMessageText,
          partyChannelName
        )
      );

      this.crossServerBroadcasterService.publish({
        type: CrossServerBroadcastType.ChannelFanOut,
        channelName: LADDER_UPDATES_CHANNEL_NAME,
        payload: {
          type: GameStateUpdateType.GameMessage,
          data: {
            message: new GameMessage(GameMessageType.LadderDeath, false, ladderDeathMessageText),
          },
        },
        excludedConnectionIds: this.userSessionRegistry.in(partyChannelName),
      });
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
      const partyChannel = getPartyChannelName(game.name, party.name);

      const levelup = levelups[id];
      if (levelup !== undefined) {
        const levelupMessageText = createLevelLadderLevelupMessage(
          name,
          controllingPlayer || "",
          levelup,
          newRank
        );
        outbox.pushFromOther(
          this.partyDelayedGameMessageFactory.createMessageInChannelWithOptionalDelayForParty(
            partyChannel,
            GameMessageType.LadderProgress,
            levelupMessageText,
            partyChannel
          )
        );
        // for non party members and users on other servers
        this.crossServerBroadcasterService.publish({
          type: CrossServerBroadcastType.ChannelFanOut,
          channelName: LADDER_UPDATES_CHANNEL_NAME,
          payload: {
            type: GameStateUpdateType.GameMessage,
            data: {
              message: new GameMessage(GameMessageType.LadderProgress, false, levelupMessageText),
            },
          },
          excludedConnectionIds: this.userSessionRegistry.in(partyChannel),
        });
      }
      const experiencePointsLadderMessageText = createLevelLadderExpRankMessage(
        name,
        controllingPlayer || "",
        character.combatantProperties.classProgressionProperties.experiencePoints.getCurrent(),
        newRank
      );
      outbox.pushFromOther(
        this.partyDelayedGameMessageFactory.createMessageInChannelWithOptionalDelayForParty(
          partyChannel,
          GameMessageType.LadderProgress,
          experiencePointsLadderMessageText,
          partyChannel
        )
      );
      this.crossServerBroadcasterService.publish({
        type: CrossServerBroadcastType.ChannelFanOut,
        channelName: LADDER_UPDATES_CHANNEL_NAME,
        payload: {
          type: GameStateUpdateType.GameMessage,
          data: {
            message: new GameMessage(
              GameMessageType.LadderProgress,
              false,
              experiencePointsLadderMessageText
            ),
          },
        },
        excludedConnectionIds: this.userSessionRegistry.in(partyChannel),
      });
    }

    return outbox;
  }
}
