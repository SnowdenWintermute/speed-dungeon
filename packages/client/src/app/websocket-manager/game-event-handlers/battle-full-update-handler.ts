import { setAlert } from "@/app/components/alerts";
import { useGameStore } from "@/stores/game-store";
import getCurrentParty from "@/utils/getCurrentParty";
import { Battle, ERROR_MESSAGES, InputLock } from "@speed-dungeon/common";

export default function battleFullUpdateHandler(battleOption: null | Battle) {
  useGameStore.getState().mutateState((gameState) => {
    const gameOption = gameState.game;
    if (gameOption === null) return setAlert(new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME));
    const game = gameOption;

    if (battleOption !== null) {
      const battle = battleOption;
      const partyOption = getCurrentParty(gameState, gameState.username || "");
      if (partyOption === undefined)
        return setAlert(new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_PARTY));
      const party = partyOption;
      party.battleId = battle.id;
      game.battles[battle.id] = battle;

      if (
        battle.turnTrackers[0] &&
        !party.characterPositions.includes(battle.turnTrackers[0].entityId)
      ) {
        // it is ai controlled so lock input
        InputLock.lockInput(party.inputLock);
      }
    } else game.battles = {};
  });
}
