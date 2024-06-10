import { setAlert } from "@/app/components/alerts";
import { AlertState } from "@/stores/alert-store";
import { GameState } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";
import { PartyClientSocket } from "@/stores/websocket-store";
import { ERROR_MESSAGES, InPartyClientToServerEvent } from "@speed-dungeon/common";

export default function setFocusedCharacter(
  mutateGameState: MutateState<GameState>,
  mutateAlertState: MutateState<AlertState>,
  partySocketOption: undefined | PartyClientSocket,
  id: string
) {
  mutateGameState((gameState) => {
    const characterSwitchingFocusAwayFromId = gameState.focusedCharacterId;
    gameState.selectedItem = null;
    gameState.detailedEntity = null;
    gameState.hoveredEntity = null;
    gameState.focusedCharacterId = id;
    const game = gameState.game;
    if (!game) return setAlert(mutateAlertState, ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
    if (!gameState.username) return setAlert(mutateAlertState, ERROR_MESSAGES.CLIENT.NO_USERNAME);
    const playerOption = game.players[gameState.username];
    if (!playerOption) return setAlert(mutateAlertState, ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);
    const playerOwnsCharacterSwitchingFocusAwayFrom = Object.keys(
      playerOption.characterIds
    ).includes(id);
    if (playerOwnsCharacterSwitchingFocusAwayFrom) {
      partySocketOption?.emit(
        InPartyClientToServerEvent.SelectCombatAction,
        characterSwitchingFocusAwayFromId,
        null
      );
    }
  });
}
