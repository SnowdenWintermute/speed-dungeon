import { setAlert } from "@/app/components/alerts";
import { websocketConnection } from "@/singletons/websocket-connection";
import { AlertState } from "@/stores/alert-store";
import { GameState, MenuContext } from "@/stores/game-store";
import { MutateState } from "@/stores/mutate-state";
import getClientPlayerAssociatedData from "@/utils/getClientPlayerAssociatedData";
import {
  CombatAction,
  ERROR_MESSAGES,
  ClientToServerEvent,
  SpeedDungeonGame,
  CombatActionType,
} from "@speed-dungeon/common";
import { getCombatActionProperties } from "@speed-dungeon/common";

export default function selectCombatActionHandler(
  gameState: GameState,
  mutateAlertState: MutateState<AlertState>,
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

    SpeedDungeonGame.assignCharacterActionTargets(
      gameState.game,
      focusedCharacter.entityProperties.id,
      gameState.username,
      combatActionPropertiesOption
    );

    // used to determine if we should put them back in viewing
    // inventory when deselecting consumable based action
    const previousActionWasConsumable =
      focusedCharacter.combatantProperties.selectedCombatAction?.type ===
      CombatActionType.ConsumableUsed;

    focusedCharacter.combatantProperties.selectedCombatAction = combatActionOption;

    if (previousActionWasConsumable) gameState.menuContext = MenuContext.InventoryItems;
    else gameState.menuContext = null;
    gameState.hoveredAction = null;
    gameState.hoveredEntity = null;

    websocketConnection.emit(ClientToServerEvent.SelectCombatAction, {
      characterId: focusedCharacter.entityProperties.id,
      combatActionOption,
    });
  });
}
