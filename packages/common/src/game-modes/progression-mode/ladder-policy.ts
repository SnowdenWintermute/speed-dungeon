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
  GameMessageType,
} from "../../packets/game-message.js";
import { GameStateUpdate } from "../../packets/game-state-updates.js";
import { MessageDispatchOutbox } from "../../servers/update-delivery/outbox.js";
import { GameModeLadderUpdatePolicy } from "../ladder-update-policy.js";

export class ProgressionModeLadderPolicy extends GameModeLadderUpdatePolicy {
  override async onLiveGameLeave(
    game: SpeedDungeonGame,
    party: AdventuringParty,
    player: SpeedDungeonPlayer
  ) {
    const characters = player.getCharactersInGame(game);
    // If they're leaving a game while dead, this character should be removed from the ladder
    const deathsAndRanks = await this.experiencePointsLadderService.removeDeadCharacters(
      characters,
      game.characterControlScheme
    );
    const deathMessages =
      await this.experiencePointsLadderService.getTopRankedDeathMessages(deathsAndRanks);

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

  override async onPartyWipe(game: SpeedDungeonGame, party: AdventuringParty) {
    const partyCharacters = party.combatantManager.getPartyMemberCharacters();
    const ladderDeathsUpdate = await this.experiencePointsLadderService.removeDeadCharacters(
      partyCharacters,
      game.characterControlScheme
    );

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    const partyChannelName = getPartyChannelName(game.name, party.name);
    for (const [characterName, deathAndRank] of Object.entries(ladderDeathsUpdate)) {
      const ladderDeathMessageText = createLadderDeathsMessage(
        characterName,
        deathAndRank.owner,
        deathAndRank.level,
        deathAndRank.rank
      );
      this.announceLadderEvent(
        outbox,
        partyChannelName,
        GameMessageType.LadderDeath,
        ladderDeathMessageText
      );
    }

    return outbox;
  }

  override async onPartyBattleVictory(
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
        await this.experiencePointsLadderService.updateOrCreateCharacterExperienceEntry(
          id,
          totalExp,
          game.characterControlScheme
        );

      if (newRank === previousRank || newRank > MAX_LADDER_RANK_GLOBAL_MESSAGE_THRESHOLD) {
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
        this.announceLadderEvent(
          outbox,
          partyChannel,
          GameMessageType.LadderProgress,
          levelupMessageText
        );
      }
      const experiencePointsLadderMessageText = createLevelLadderExpRankMessage(
        name,
        controllingPlayer || "",
        character.combatantProperties.classProgressionProperties.experiencePoints.getCurrent(),
        newRank
      );
      this.announceLadderEvent(
        outbox,
        partyChannel,
        GameMessageType.LadderProgress,
        experiencePointsLadderMessageText
      );
    }

    return outbox;
  }
}
