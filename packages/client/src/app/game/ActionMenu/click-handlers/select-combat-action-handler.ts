import { setAlert } from "@/app/components/alerts";
import { AlertState } from "@/stores/alert-store";
import { GameState } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";
import { PartyClientSocket } from "@/stores/websocket-store";
import getFocusedCharacter from "@/utils/getFocusedCharacter";
import getGameAndParty from "@/utils/getGameAndParty";
import { CombatAction, ERROR_MESSAGES, InPartyClientToServerEvent } from "@speed-dungeon/common";
import assignCharacterActionTargets from "@speed-dungeon/common/src/combat/targeting/assign-character-action-targets";

export default function selectCombatActionHandler(
  gameState: GameState,
  mutateAlertState: MutateState<AlertState>,
  partySocket: PartyClientSocket,
  combatActionOption: null | CombatAction
) {
  const gameAndPartyResult = getGameAndParty(gameState.game, gameState.username);
  if (gameAndPartyResult instanceof Error)
    return setAlert(mutateAlertState, gameAndPartyResult.message);
  const focusedCharacterResult = getFocusedCharacter(gameState);
  if (focusedCharacterResult instanceof Error)
    return setAlert(mutateAlertState, focusedCharacterResult.message);
  const [game, party] = gameAndPartyResult;

  const combatActionPropertiesOption = combatActionOption
    ? party.getCombatActionProperties(
        combatActionOption,
        focusedCharacterResult.entityProperties.id
      )
    : null;
  if (combatActionPropertiesOption instanceof Error) return combatActionPropertiesOption;
  if (!gameState.username) return new Error(ERROR_MESSAGES.CLIENT.NO_USERNAME);

  assignCharacterActionTargets(
    game,
    focusedCharacterResult.entityProperties.id,
    gameState.username,
    combatActionPropertiesOption
  );

  gameState.mutateState((state) => (state.menuContext = null));
  partySocket.emit(
    InPartyClientToServerEvent.SelectCombatAction,
    focusedCharacterResult.entityProperties.id,
    combatActionOption
  );
}
