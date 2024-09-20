import {
  BattleConclusion,
  BattleResultActionCommandPayload,
  ERROR_MESSAGES,
  GameMessageType,
  ServerToClientEvent,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { GameServer } from "../../index.js";
import { ActionCommandManager } from "@speed-dungeon/common";

export default function battleResultActionCommandHandler(
  this: GameServer,
  actionCommandManager: ActionCommandManager,
  gameName: string,
  combatantId: string,
  payload: BattleResultActionCommandPayload
) {
  const actionAssociatedDataResult = this.getGamePartyAndCombatant(gameName, combatantId);
  if (actionAssociatedDataResult instanceof Error) return actionAssociatedDataResult;
  const { game, party } = actionAssociatedDataResult;
  const { conclusion } = payload;

  switch (conclusion) {
    case BattleConclusion.Defeat:
      if (party.battleId !== null) delete game.battles[party.battleId];
      const socketIdsOfPlayersInOtherPartiesResult = this.getSocketIdsOfPlayersInOtherParties(
        game,
        party
      );
      if (socketIdsOfPlayersInOtherPartiesResult instanceof Error)
        return socketIdsOfPlayersInOtherPartiesResult;
      const socketIdsOfPlayersInOtherParties = socketIdsOfPlayersInOtherPartiesResult;
      for (const socketId of socketIdsOfPlayersInOtherParties) {
        const socketOption = this.io.sockets.sockets.get(socketId);
        if (socketOption === undefined) return new Error(ERROR_MESSAGES.SERVER.SOCKET_NOT_FOUND);
        socketOption.emit(ServerToClientEvent.GameMessage, {
          type: GameMessageType.PartyWipe,
          partyName: party.name,
          dlvl: party.currentFloor,
          timeOfWipe: new Date().getTime(),
        });
      }

      for (const username of party.playerUsernames)
        SpeedDungeonGame.removePlayerFromParty(game, username);
      break;
    case BattleConclusion.Victory:
      SpeedDungeonGame.handleBattleVictory(game, party, payload);
      break;
  }

  actionCommandManager.processNextCommand();
}
