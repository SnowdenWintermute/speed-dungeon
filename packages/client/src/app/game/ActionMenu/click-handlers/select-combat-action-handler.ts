import { setAlert } from "@/app/components/alerts";
import { AlertState } from "@/stores/alert-store";
import { GameState } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";
import { PartyClientSocket } from "@/stores/websocket-store";
import getClientPlayerAssociatedData from "@/utils/getClientPlayerAssociatedData";
import { CombatAction, ERROR_MESSAGES, InPartyClientToServerEvent } from "@speed-dungeon/common";
import assignCharacterActionTargets from "@speed-dungeon/common/src/combat/targeting/assign-character-action-targets";
import { getCombatActionProperties } from "@speed-dungeon/common/src/combatants/get-combat-action-properties";

export default function selectCombatActionHandler(
  gameState: GameState,
  mutateAlertState: MutateState<AlertState>,
  partySocket: PartyClientSocket,
  combatActionOption: null | CombatAction
) {
  gameState.mutateState((gameState) => {
    const clientPlayerAssociatedDataResult = getClientPlayerAssociatedData(gameState);
    if (clientPlayerAssociatedDataResult instanceof Error)
      return setAlert(mutateAlertState, clientPlayerAssociatedDataResult.message);
    const { party, focusedCharacter } = clientPlayerAssociatedDataResult;

    const combatActionPropertiesOption = combatActionOption
      ? getCombatActionProperties(party, combatActionOption, focusedCharacter.entityProperties.id)
      : null;
    if (combatActionPropertiesOption instanceof Error) return combatActionPropertiesOption;
    if (!gameState.username) return new Error(ERROR_MESSAGES.CLIENT.NO_USERNAME);

    if (!gameState.username) return setAlert(mutateAlertState, ERROR_MESSAGES.CLIENT.NO_USERNAME);
    if (!gameState.game) return setAlert(mutateAlertState, ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
    assignCharacterActionTargets(
      gameState.game,
      focusedCharacter.entityProperties.id,
      gameState.username,
      combatActionPropertiesOption
    );

    focusedCharacter.combatantProperties.selectedCombatAction = combatActionOption;

    gameState.menuContext = null;

    partySocket.emit(
      InPartyClientToServerEvent.SelectCombatAction,
      focusedCharacter.entityProperties.id,
      combatActionOption
    );
  });
}
