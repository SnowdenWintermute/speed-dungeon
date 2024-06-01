import { setAlert } from "@/app/components/alerts";
import { AlertState } from "@/stores/alert-store";
import { GameState } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";
import { PartyClientSocket } from "@/stores/websocket-store";
import getFocusedCharacter from "@/utils/getFocusedCharacter";
import getGameAndParty from "@/utils/getGameAndParty";
import { NextOrPrevious } from "@speed-dungeon/common";

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

    //
  });
}
