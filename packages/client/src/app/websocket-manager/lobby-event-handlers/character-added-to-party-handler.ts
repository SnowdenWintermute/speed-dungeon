import { Combatant, ERROR_MESSAGES, GameMode, addCharacterToParty } from "@speed-dungeon/common";
import { setAlert } from "../../components/alerts";
import { useGameStore } from "@/stores/game-store";
import { gameWorld } from "@/app/3d-world/SceneManager";
import { ModelActionType } from "@/app/3d-world/game-world/model-manager/model-actions";

export default async function characterAddedToPartyHandler(
  partyName: string,
  username: string,
  character: Combatant
) {
  useGameStore.getState().mutateState((gameState) => {
    const game = gameState.game;
    if (!game) return setAlert(new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME));
    const party = game.adventuringParties[partyName];
    if (!party) return setAlert(new Error(ERROR_MESSAGES.GAME.PARTY_DOES_NOT_EXIST));
    const player = game.players[username];
    if (!player) return setAlert(new Error(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST));
    try {
      addCharacterToParty(game, party, player, character, true);
    } catch (error) {
      if (error instanceof Error) setAlert(error.message);
      else console.error(error);
    }

    if (game.mode === GameMode.Progression) {
      gameWorld.current?.modelManager.modelActionQueue.enqueueMessage({
        type: ModelActionType.SynchronizeCombatantModels,
      });
    }
  });
}
