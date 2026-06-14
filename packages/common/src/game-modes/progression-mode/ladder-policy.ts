import { AdventuringParty } from "../../adventuring-party/index.js";
import { EntityId } from "../../aliases.js";
import { MAX_LADDER_RANK_GLOBAL_MESSAGE_THRESHOLD } from "../../app-consts.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { SpeedDungeonPlayer } from "../../game/player.js";
import { getPartyChannelName, LADDER_UPDATES_CHANNEL_NAME } from "../../packets/channels.js";
import {
  createLadderDeathsMessage,
  createLevelLadderExpRankMessage,
  createLevelLadderLevelupMessage,
  GameMessage,
  GameMessageType,
} from "../../packets/game-message.js";
import { GameStateUpdate, GameStateUpdateType } from "../../packets/game-state-updates.js";
import { CrossServerBroadcastType } from "../../servers/services/cross-server-broadcaster/index.js";
import { MessageDispatchOutbox } from "../../servers/update-delivery/outbox.js";
import { GameModeLadderUpdatePolicy } from "../ladder-update-policy.js";

// TODO
// switch on game control scheme to determine which ladder to save to

export class ProgressionModeLadderPolicy extends GameModeLadderUpdatePolicy {
  override async onLiveGameLeave(
    game: SpeedDungeonGame,
    party: AdventuringParty,
    player: SpeedDungeonPlayer
  ) {
    const characters = player.getCharactersInGame(game);
    // If they're leaving a game while dead, this character should be removed from the ladder
    const deathsAndRanks = await this.characterLevelLadderService.removeDeadCharacters(characters);
    const deathMessages =
      await this.characterLevelLadderService.getTopRankedDeathMessages(deathsAndRanks);

    const ladderDeathMessagesOutboxes = deathMessages.map((message) =>
      this.partyDelayedGameMessageFactory.createMessageInChannelWithOptionalDelayForParty(
        LADDER_UPDATES_CHANNEL_NAME,
        message.type,
        message.message,
        getPartyChannelName(game.name, party.name)
      )
    );
    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    for (const ladderDeathMessageOutbox of ladderDeathMessagesOutboxes) {
      outbox.pushFromOther(ladderDeathMessageOutbox);
    }

    return outbox;
  }

  async onPartyWipe(game: SpeedDungeonGame, party: AdventuringParty) {
    const partyCharacters = party.combatantManager.getPartyMemberCharacters();
    const ladderDeathsUpdate =
      await this.characterLevelLadderService.removeDeadCharacters(partyCharacters);

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

  async onPartyBattleVictory(
    game: SpeedDungeonGame,
    party: AdventuringParty,
    levelups: Record<EntityId, number>
  ) {
    const partyCharacters = party.combatantManager.getPartyMemberCharacters();

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);

    for (const character of partyCharacters) {
      const { classProgressionProperties } = character.combatantProperties;
      const totalExp = classProgressionProperties.totalExperiencePoints;

      const { id } = character.entityProperties;
      const { previousRank, newRank } =
        await this.characterLevelLadderService.updateOrCreateCharacterLevelEntry(id, totalExp);

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
