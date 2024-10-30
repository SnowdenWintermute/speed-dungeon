import {
  ActionCommandType,
  AdventuringParty,
  Combatant,
  GameMessageType,
  ServerToClientEvent,
  SpeedDungeonGame,
  SpeedDungeonPlayer,
  createLadderDeathsMessage,
  createLevelLadderRankMessage,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { GameModeStrategy } from "./index.js";
import writePlayerCharactersInGameToDb, {
  writeAllPlayerCharacterInGameToDb,
} from "../../saved-character-event-handlers/write-player-characters-in-game-to-db.js";
import { getGameServer } from "../../../index.js";
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
    notifyOnlinePlayersOfTopRankedDeaths(deathsAndRanks, "");
  }

  onPartyLeave(
    game: SpeedDungeonGame,
    party: AdventuringParty,
    player: SpeedDungeonPlayer
  ): Promise<void | Error> {
    // check if all remaining characters are dead
    // call onPartyWipe if so
    // this would happen if a player disconnects mid battle and all their allies were dead in that battle
  }

  onLastPlayerLeftGame(game: SpeedDungeonGame): Promise<void | Error> {
    return Promise.resolve();
  }

  onPartyEscape(game: SpeedDungeonGame, party: AdventuringParty): Promise<void | Error> {
    return Promise.resolve();
  }

  async onPartyWipe(game: SpeedDungeonGame, party: AdventuringParty): Promise<void | Error> {
    const partyChannel = getPartyChannelName(game.name, party.name);
    const ladderDeathsUpdate = await removeDeadCharactersFromLadder(party.characters);
    // send action command to party memebers with ladder update so they see it after their battle report
    const messages: string[] = [];
    for (const [characterName, deathAndRank] of Object.entries(ladderDeathsUpdate)) {
      messages.push(
        createLadderDeathsMessage(
          characterName,
          deathAndRank.owner,
          deathAndRank.level,
          deathAndRank.rank
        )
      );
    }

    getGameServer() // a delayed message to be displayed in the client's action command queue
      .io.in(partyChannel)
      .emit(ServerToClientEvent.ActionCommandPayloads, "", [
        {
          type: ActionCommandType.LadderUpdate,
          messages,
        },
      ]);

    // let everyone else know immediately
    notifyOnlinePlayersOfTopRankedDeaths(ladderDeathsUpdate, partyChannel);
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
      const levelLadderUpdateMessage = createLevelLadderRankMessage(
        name,
        controllingPlayer || "",
        level,
        newRank
      );

      // only tell the players once their battle report is completed
      getGameServer()
        .io.in(partyChannel)
        .emit(ServerToClientEvent.ActionCommandPayloads, "", [
          {
            type: ActionCommandType.LadderUpdate,
            messages: [levelLadderUpdateMessage],
          },
        ]);

      // everyone else on the server can just be updated immediately
      getGameServer()
        .io.except(partyChannel)
        .emit(ServerToClientEvent.GameMessage, {
          type: GameMessageType.LadderProgress,
          characterName: name,
          playerName: controllingPlayer || "",
          level,
          rank: newRank,
        });
    }
  }
}
