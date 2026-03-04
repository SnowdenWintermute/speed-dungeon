import { ActionCommandReceiver } from "../../../action-processing/action-command-receiver.js";
import {
  CombatActionReplayTreePayload,
  BattleResultActionCommandPayload,
  ActionCommandPayload,
  GameMessagesPayload,
  ActionCommandType,
} from "../../../action-processing/index.js";
import { GameName, Username } from "../../../aliases.js";
import { Battle, BattleConclusion } from "../../../battle/index.js";
import { getPartyChannelName } from "../../../packets/channels.js";
import {
  createPartyWipeMessage,
  GameMessage,
  GameMessageType,
} from "../../../packets/game-message.js";
import { GameMode } from "../../../types.js";
import { GameRegistry } from "../../game-registry.js";
import { GameModeContext } from "./game-lifecycle/game-mode-context.js";

export class GameServerGameEventCommandReceiver implements ActionCommandReceiver {
  constructor(
    private gameRegistry: GameRegistry,
    private gameModeContexts: Record<GameMode, GameModeContext>
  ) {}
  async combatActionReplayTreeHandler(payload: CombatActionReplayTreePayload): Promise<void> {
    return;
  }

  async battleResultActionCommandHandler(
    gameName: GameName,
    payload: BattleResultActionCommandPayload
  ) {
    const game = this.gameRegistry.requireGame(gameName);
    const party = game.getExpectedParty(payload.partyName);

    const gameModeContext = this.gameModeContexts[game.mode];
    const { conclusion } = payload;

    const gameMessagePayloads: ActionCommandPayload[] = [];

    await gameModeContext.strategy.onBattleResult(game, party);

    switch (conclusion) {
      case BattleConclusion.Defeat: {
        if (party.battleId !== null) {
          game.battles.delete(party.battleId);
        }
        party.battleId = null;

        party.timeOfWipe = Date.now();

        const floorNumber = party.dungeonExplorationManager.getCurrentFloor();

        gameMessagePayloads.push({
          type: ActionCommandType.GameMessages,
          messages: [
            new GameMessage(
              GameMessageType.PartyWipe,
              true,
              createPartyWipeMessage(party.name, floorNumber, new Date())
            ),
          ],
          partyChannelToExclude: getPartyChannelName(game.name, party.name),
        });

        const defeatMessagePayloadResults = await gameModeContext.strategy.onPartyWipe(game, party);
        if (defeatMessagePayloadResults instanceof Error) {
          throw defeatMessagePayloadResults;
        }
        if (defeatMessagePayloadResults) {
          gameMessagePayloads.push(...defeatMessagePayloadResults);
        }
        break;
      }
      case BattleConclusion.Victory: {
        const levelups = Battle.handleVictory(game, party, payload);
        const victoryMessagePayloadResults = await gameModeContext.strategy.onPartyVictory(
          game,
          party,
          levelups
        );
        if (victoryMessagePayloadResults instanceof Error) return victoryMessagePayloadResults;
        if (victoryMessagePayloadResults) gameMessagePayloads.push(...victoryMessagePayloadResults);
        break;
      }
    }
    return gameMessagePayloads;
  }

  async gameMessageCommandHandler(
    payload: GameMessagesPayload,
    partyChannelToExcludeOption?: string
  ): Promise<void> {
    return;
  }
  async removePlayerFromGameCommandHandler(username: Username): Promise<void> {
    return;
  }
}
