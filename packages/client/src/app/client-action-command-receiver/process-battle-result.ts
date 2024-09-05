import {
  BattleConclusion,
  BattleResultActionCommandPayload,
  ERROR_MESSAGES,
} from "@speed-dungeon/common";
import { ClientActionCommandReceiver } from ".";
import getCurrentParty from "@/utils/getCurrentParty";

export default function battleResultActionCommandHandler(
  this: ClientActionCommandReceiver,
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
        partyOption.currentFloor = 999;
      });
      break;
    case BattleConclusion.Victory:
    //
  }
}
