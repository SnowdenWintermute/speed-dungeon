import { setAlert } from "@/app/components/alerts";
import { AlertState } from "@/stores/alert-store";
import { GameState } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";
import { PartyClientSocket } from "@/stores/websocket-store";
import getFocusedCharacter from "@/utils/getFocusedCharacter";
import getGameAndParty from "@/utils/getGameAndParty";
import { ERROR_MESSAGES, InPartyClientToServerEvent, NextOrPrevious } from "@speed-dungeon/common";
import cycleCharacterTargets from "@speed-dungeon/common/src/combat/targeting/cycle-character-targets";

export default function cycleCombatActionTargetsHandler(
  mutateGameState: MutateState<GameState>,
  mutateAlertState: MutateState<AlertState>,
  partySocket: PartyClientSocket,
  direction: NextOrPrevious
) {
  mutateGameState((gameState) => {
    const gameAndPartyResult = getGameAndParty(gameState.game, gameState.username);
    if (gameAndPartyResult instanceof Error)
      return setAlert(mutateAlertState, gameAndPartyResult.message);
    const [game, party] = gameAndPartyResult;
    const focusedCharacterResult = getFocusedCharacter(gameState);
    if (focusedCharacterResult instanceof Error)
      return setAlert(mutateAlertState, focusedCharacterResult.message);
    const focusedCharacter = focusedCharacterResult;
    if (!gameState.username) return setAlert(mutateAlertState, ERROR_MESSAGES.CLIENT.NO_USERNAME);
    const playerOption = game.players[gameState.username];
    if (!playerOption) return setAlert(mutateAlertState, ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);

    const result = cycleCharacterTargets(
      game,
      party,
      playerOption,
      focusedCharacter.entityProperties.id,
      direction
    );
    if (result instanceof Error) return setAlert(mutateAlertState, result.message);

    partySocket.emit(
      InPartyClientToServerEvent.CycleCombatActionTargets,
      focusedCharacter.entityProperties.id,
      direction
    );
  });
}
