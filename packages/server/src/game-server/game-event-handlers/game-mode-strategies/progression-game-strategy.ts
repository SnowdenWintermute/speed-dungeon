import {
  AdventuringParty,
  Combatant,
  GameMessage,
  GameMessageType,
  ServerToClientEvent,
  SpeedDungeonGame,
  SpeedDungeonPlayer,
  createLevelLadderRankMessage,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { GameModeStrategy } from "./index.js";
import writePlayerCharactersInGameToDb, {
  writeAllPlayerCharacterInGameToDb,
} from "../../saved-character-event-handlers/write-player-characters-in-game-to-db.js";
import { getGameServer } from "../../../singletons.js";
import { removeDeadCharactersFromLadder } from "../../../kv-store/utils.js";
import { notifyOnlinePlayersOfTopRankedDeaths } from "../../ladders/utils.js";
import { valkeyManager } from "../../../kv-store/index.js";
import { CHARACTER_LEVEL_LADDER } from "../../../kv-store/consts.js";

export default class ProgressionGameStrategy implements GameModeStrategy {
  async onGameStart(game: SpeedDungeonGame): Promise<void | Error> {
    // we don't need to do anything unless their character changes
    return Promise.resolve();
  }

  async onBattleResult(game: SpeedDungeonGame, party: AdventuringParty): Promise<Error | void> {
    await writeAllPlayerCharacterInGameToDb(getGameServer(), game);
  }

  async onGameLeave(
    game: SpeedDungeonGame,
    party: AdventuringParty,
    player: SpeedDungeonPlayer
  ): Promise<void | Error> {
    const maybeError = await writePlayerCharactersInGameToDb(game, player);
    if (maybeError instanceof Error) return maybeError;

    // If they're leaving a game while dead, this character should be removed from the ladder
    const characters: { [combatantId: string]: Combatant } = {};
    for (const id of player.characterIds) {
      const characterResult = SpeedDungeonGame.getCharacter(game, party.name, id);
      if (characterResult instanceof Error) return characterResult;
      characters[characterResult.entityProperties.id] = characterResult;
    }
    const deathsAndRanks = await removeDeadCharactersFromLadder(characters);
    notifyOnlinePlayersOfTopRankedDeaths(deathsAndRanks);
  }

  onLastPlayerLeftGame(game: SpeedDungeonGame): Promise<void | Error> {
    return Promise.resolve();
  }

  onPartyEscape(game: SpeedDungeonGame, party: AdventuringParty): Promise<void | Error> {
    return Promise.resolve();
  }

  async onPartyWipe(game: SpeedDungeonGame, party: AdventuringParty): Promise<void | Error> {
    const ladderDeathsUpdate = await removeDeadCharactersFromLadder(party.characters);
    notifyOnlinePlayersOfTopRankedDeaths(ladderDeathsUpdate);
  }

  async onPartyVictory(
    game: SpeedDungeonGame,
    party: AdventuringParty,
    levelups: { [id: string]: number }
  ): Promise<void | Error> {
    const partyChannel = getPartyChannelName(game.name, party.name);
    for (const character of Object.values(party.characters)) {
      const { name, id } = character.entityProperties;

      if (levelups[id] === undefined) continue;

      const { level, controllingPlayer } = character.combatantProperties;
      const currentRankOption = await valkeyManager.context.zRevRank(CHARACTER_LEVEL_LADDER, id);
      await valkeyManager.context.zAdd(CHARACTER_LEVEL_LADDER, [{ value: id, score: level }]);
      const newRank = await valkeyManager.context.zRevRank(CHARACTER_LEVEL_LADDER, id);
      // - if they ranked up and were in the top 10 ranks, emit a message to everyone
      if (newRank === null || newRank === currentRankOption || newRank >= 10) continue;

      getGameServer()
        .io.except(partyChannel)
        .emit(
          ServerToClientEvent.GameMessage,
          new GameMessage(
            GameMessageType.LadderProgress,
            false,
            createLevelLadderRankMessage(name, controllingPlayer || "", level, newRank)
          )
        );
    }
  }
}
