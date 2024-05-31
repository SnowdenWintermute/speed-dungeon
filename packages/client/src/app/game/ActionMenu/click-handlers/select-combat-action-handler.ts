import { setAlert } from "@/app/components/alerts";
import { AlertState } from "@/stores/alert-store";
import { GameState } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";
import { PartyClientSocket } from "@/stores/websocket-store";
import getFocusedCharacter from "@/utils/getFocusedCharacter";
import getGameAndParty from "@/utils/getGameAndParty";
import { CombatAction } from "@speed-dungeon/common";

export default function selectCombatActionHandler(
  gameState: GameState,
  mutateAlertState: MutateState<AlertState>,
  partySocket: PartyClientSocket,
  combatActionOption: null | CombatAction
) {
  const gameAndPartyResult = getGameAndParty(gameState.game, gameState.username);
  if (gameAndPartyResult instanceof Error) setAlert(mutateAlertState, gameAndPartyResult.message);
  const focusedCharacterResult = getFocusedCharacter(gameState);
  if (focusedCharacterResult instanceof Error)
    setAlert(mutateAlertState, focusedCharacterResult.message);

  // assignCharacterActionTargets
  // emit SelectCombatAction
}
