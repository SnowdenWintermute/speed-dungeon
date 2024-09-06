import {
  BattleConclusion,
  BattleResultActionCommandPayload,
  ERROR_MESSAGES,
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
  const { conclusion, experiencePointChanges, loot, timestamp } = payload;
  switch (payload.conclusion) {
    case BattleConclusion.Defeat:
      this.mutateGameState((state) => {
        if (state.username === null) return console.error(ERROR_MESSAGES.CLIENT.NO_USERNAME);
        const partyOption = getCurrentParty(state, state.username);
        if (partyOption === undefined) return console.error(ERROR_MESSAGES.CLIENT.NO_CURRENT_PARTY);
        console.log("set party death timestamp ", timestamp);
        partyOption.timeOfWipe = timestamp;
      });
      break;
    case BattleConclusion.Victory:
    //
  }
}
