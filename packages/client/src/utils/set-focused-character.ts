import { setAlert } from "@/app/components/alerts";
import { useGameStore } from "@/stores/game-store";
import { ERROR_MESSAGES, ClientToServerEvent } from "@speed-dungeon/common";
import { websocketConnection } from "@/singletons/websocket-connection";

export default function setFocusedCharacter(id: string) {
  useGameStore.getState().mutateState((gameState) => {
    const characterSwitchingFocusAwayFromId = gameState.focusedCharacterId;
    gameState.detailedEntity = null;
    gameState.hoveredEntity = null;
    gameState.focusedCharacterId = id;
    const game = gameState.game;
    if (!game) return setAlert(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
    if (!gameState.username) return setAlert(ERROR_MESSAGES.CLIENT.NO_USERNAME);
    const playerOption = game.players[gameState.username];
    if (!playerOption) return setAlert(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);
    const playerOwnsCharacterSwitchingFocusAwayFrom = playerOption.characterIds.includes(
      characterSwitchingFocusAwayFromId
    );

    if (playerOwnsCharacterSwitchingFocusAwayFrom) {
      websocketConnection.emit(ClientToServerEvent.SelectCombatAction, {
        characterId: characterSwitchingFocusAwayFromId,
        combatActionOption: null,
      });
    }
  });
}
