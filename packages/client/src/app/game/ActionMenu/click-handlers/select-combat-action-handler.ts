import { setAlert } from "@/app/components/alerts";
import { AlertState } from "@/stores/alert-store";
import { GameState } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";
import { PartyClientSocket } from "@/stores/websocket-store";
import getClientPlayerAssociatedData from "@/utils/getClientPlayerAssociatedData";
import { CombatAction, ERROR_MESSAGES, InPartyClientToServerEvent } from "@speed-dungeon/common";
import assignCharacterActionTargets from "@speed-dungeon/common/src/combat/targeting/assign-character-action-targets";

export default function selectCombatActionHandler(
  gameState: GameState,
  mutateAlertState: MutateState<AlertState>,
  partySocket: PartyClientSocket,
  combatActionOption: null | CombatAction
) {
  const clientPlayerAssociatedDataResult = getClientPlayerAssociatedData(gameState);
  if (clientPlayerAssociatedDataResult instanceof Error)
    return setAlert(mutateAlertState, clientPlayerAssociatedDataResult.message);
  const { game, party, focusedCharacter } = clientPlayerAssociatedDataResult;

  const combatActionPropertiesOption = combatActionOption
    ? party.getCombatActionProperties(combatActionOption, focusedCharacter.entityProperties.id)
    : null;
  if (combatActionPropertiesOption instanceof Error) return combatActionPropertiesOption;
  if (!gameState.username) return new Error(ERROR_MESSAGES.CLIENT.NO_USERNAME);

  assignCharacterActionTargets(
    game,
    focusedCharacter.entityProperties.id,
    gameState.username,
    combatActionPropertiesOption
  );

  gameState.mutateState((state) => (state.menuContext = null));
  partySocket.emit(
    InPartyClientToServerEvent.SelectCombatAction,
    focusedCharacter.entityProperties.id,
    combatActionOption
  );
}
