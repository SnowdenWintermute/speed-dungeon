import {
  BattleConclusion,
  BattleResultActionCommandPayload,
  ERROR_MESSAGES,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { ClientActionCommandReceiver } from ".";
import getCurrentParty from "@/utils/getCurrentParty";
import { ActionCommandManager } from "@speed-dungeon/common/src/action-processing/action-command-manager";

export default function battleResultActionCommandHandler(
  this: ClientActionCommandReceiver,
  actionCommandManager: ActionCommandManager,
  _gameName: string,
  _combatantId: string,
  payload: BattleResultActionCommandPayload
) {
  const { timestamp } = payload;
  this.mutateGameState((state) => {
    const gameOption = state.game;
    if (gameOption === null) return console.error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
    if (state.username === null) return console.error(ERROR_MESSAGES.CLIENT.NO_USERNAME);
    const partyOption = getCurrentParty(state, state.username);
    if (partyOption === undefined) return console.error(ERROR_MESSAGES.CLIENT.NO_CURRENT_PARTY);
    switch (payload.conclusion) {
      case BattleConclusion.Defeat:
        partyOption.timeOfWipe = timestamp;
        break;
      case BattleConclusion.Victory:
        SpeedDungeonGame.handleBattleVictory(gameOption, partyOption, payload);
        break;
    }
  });
  actionCommandManager.processNextCommand();
}
