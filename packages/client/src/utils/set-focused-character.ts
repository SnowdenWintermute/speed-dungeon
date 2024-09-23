import { setAlert } from "@/app/components/alerts";
import { AlertState } from "@/stores/alert-store";
import { GameState } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";
import { PartyClientSocket } from "@/stores/websocket-store";
import { ERROR_MESSAGES, ClientToServerEvent } from "@speed-dungeon/common";

export default function setFocusedCharacter(
  mutateGameState: MutateState<GameState>,
  mutateAlertState: MutateState<AlertState>,
  socketOption: undefined | PartyClientSocket,
  id: string
) {
  mutateGameState((gameState) => {
    const characterSwitchingFocusAwayFromId = gameState.focusedCharacterId;
    gameState.detailedEntity = null;
    gameState.hoveredEntity = null;
    gameState.focusedCharacterId = id;
    const game = gameState.game;
    if (!game) return setAlert(mutateAlertState, ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
    if (!gameState.username) return setAlert(mutateAlertState, ERROR_MESSAGES.CLIENT.NO_USERNAME);
    const playerOption = game.players[gameState.username];
    if (!playerOption) return setAlert(mutateAlertState, ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);
    const playerOwnsCharacterSwitchingFocusAwayFrom = playerOption.characterIds.includes(
      characterSwitchingFocusAwayFromId
    );

    console.log(
      "playerOwnsCharacterSwitchingFocusAwayFrom: ",
      playerOwnsCharacterSwitchingFocusAwayFrom
    );

    if (playerOwnsCharacterSwitchingFocusAwayFrom) {
      socketOption?.emit(
        ClientToServerEvent.SelectCombatAction,
        characterSwitchingFocusAwayFromId,
        null
      );
    }
  });
}
