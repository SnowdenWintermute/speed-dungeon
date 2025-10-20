import {
  ActionCommandPayload,
  ActionCommandType,
  AdventuringParty,
  Combatant,
  GameMessage,
  GameMessageType,
  SpeedDungeonGame,
  SpeedDungeonPlayer,
  calculateTotalExperience,
  createLevelLadderExpRankMessage,
  createLevelLadderLevelupMessage,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { GameModeStrategy } from "./index.js";
import {
  writePlayerCharactersInGameToDb,
  writeAllPlayerCharacterInGameToDb,
} from "../../saved-character-event-handlers/write-player-characters-in-game-to-db.js";
import { getGameServer } from "../../../singletons/index.js";
import { removeDeadCharactersFromLadder } from "../../../kv-store/utils.js";
import { getTopRankedDeathMessagesActionCommandPayload } from "../../ladders/utils.js";
import { valkeyManager } from "../../../kv-store/index.js";
import { CHARACTER_LEVEL_LADDER } from "../../../kv-store/consts.js";

export default class ProgressionGameStrategy implements GameModeStrategy {
  async onGameStart(_game: SpeedDungeonGame): Promise<void | Error> {
    // we don't need to do anything unless their character changes
    return Promise.resolve();
  }

  async onBattleResult(game: SpeedDungeonGame, _party: AdventuringParty): Promise<Error | void> {
    await writeAllPlayerCharacterInGameToDb(getGameServer(), game);
  }

  async onGameLeave(
    game: SpeedDungeonGame,
    party: AdventuringParty,
    player: SpeedDungeonPlayer
  ): Promise<void | Error | ActionCommandPayload[]> {
    const characters: Combatant[] = [];

    for (const id of player.characterIds) {
      const characterResult = SpeedDungeonGame.getCombatantById(game, id);
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

  onLastPlayerLeftGame(_game: SpeedDungeonGame): Promise<void | Error> {
    return Promise.resolve();
  }

  onPartyEscape(_game: SpeedDungeonGame, _party: AdventuringParty): Promise<void | Error> {
    return Promise.resolve();
  }

  async onPartyWipe(
    game: SpeedDungeonGame,
    party: AdventuringParty
  ): Promise<void | Error | ActionCommandPayload[]> {
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
    levelups: { [id: string]: number }
  ): Promise<void | Error | ActionCommandPayload[]> {
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

      const controllingPlayer = controlledBy.controllerName;

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
