import {
  ActionCommandType,
  BattleConclusion,
  BattleResultActionCommandPayload,
  GameMessageType,
  GameMode,
  ServerToClientEvent,
  SpeedDungeonGame,
  createLadderDeathsMessage,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { GameServer } from "../../index.js";
import { ActionCommandManager } from "@speed-dungeon/common";
import { writeAllPlayerCharacterInGameToDb } from "../../saved-character-event-handlers/write-player-characters-in-game-to-db.js";
import { valkeyManager } from "../../../kv-store/index.js";
import { CHARACTER_LEVEL_LADDER } from "../../../kv-store/consts.js";
import { removeDeadCharactersFromLadder } from "../../../kv-store/utils.js";
import { getGameServer } from "../../../index.js";
import { notifyOnlinePlayersOfTopRankedDeaths } from "../../ladders/utils.js";

export default async function battleResultActionCommandHandler(
  this: GameServer,
  actionCommandManager: ActionCommandManager,
  gameName: string,
  combatantId: string,
  payload: BattleResultActionCommandPayload
) {
  const gameServer = getGameServer();
  const actionAssociatedDataResult = this.getGamePartyAndCombatant(gameName, combatantId);
  if (actionAssociatedDataResult instanceof Error) return actionAssociatedDataResult;
  const { game, party } = actionAssociatedDataResult;
  const { conclusion } = payload;

  // for deciding if we need to update their rank
  const characterLevelsBeforeChanges: { [id: string]: number } = {};
  if (game.mode === GameMode.Progression)
    for (const character of Object.values(party.characters)) {
      characterLevelsBeforeChanges[character.entityProperties.id] =
        character.combatantProperties.level;
    }

  if (game.mode === GameMode.Progression) await writeAllPlayerCharacterInGameToDb(this, game);

  switch (conclusion) {
    case BattleConclusion.Defeat:
      if (party.battleId !== null) delete game.battles[party.battleId];
      const partyChannel = getPartyChannelName(game.name, party.name);

      gameServer.io.in(game.name).except(partyChannel).emit(ServerToClientEvent.GameMessage, {
        type: GameMessageType.PartyWipe,
        partyName: party.name,
        dlvl: party.currentFloor,
        timeOfWipe: new Date().getTime(),
      });

      if (game.mode === GameMode.Progression) {
        // REMOVE DEAD CHARACTERS FROM LADDER
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

        gameServer.io
          .in(partyChannel)
          .emit(ServerToClientEvent.ActionCommandPayloads, combatantId, [
            {
              type: ActionCommandType.LadderUpdate,
              messages,
            },
          ]);
        // let everyone else know immediately
        notifyOnlinePlayersOfTopRankedDeaths(ladderDeathsUpdate, partyChannel);
      }

      for (const username of party.playerUsernames)
        SpeedDungeonGame.removePlayerFromParty(game, username);

      break;
    case BattleConclusion.Victory:
      SpeedDungeonGame.handleBattleVictory(game, party, payload);
      break;
  }

  if (game.mode === GameMode.Progression) {
    for (const character of Object.values(party.characters)) {
      const { name, id } = character.entityProperties;
      const { level, controllingPlayer } = character.combatantProperties;
      if (level !== characterLevelsBeforeChanges[id]) {
        const currentRankOption = await valkeyManager.context.zRank(CHARACTER_LEVEL_LADDER, id);
        const newRank = await valkeyManager.context.zAdd(CHARACTER_LEVEL_LADDER, [
          { value: id, score: level },
        ]);

        // - if they ranked up and were in the top 10 ranks, emit a message to everyone
        if (newRank === currentRankOption || newRank >= 10) continue;
        console.log(
          `${name} [${controllingPlayer}] gained level ${level} and rose to rank ${newRank} in the ladder!`
        );
        getGameServer().io.emit(ServerToClientEvent.GameMessage, {
          type: GameMessageType.LadderProgress,
          characterName: name,
          playerName: controllingPlayer || "",
          level,
          rank: newRank,
        });
      }
    }
  }

  actionCommandManager.processNextCommand();
}
