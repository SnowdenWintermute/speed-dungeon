import { useGameStore } from "@/stores/game-store";
import {
  ActionButtonCategory,
  ActionButtonsByCategory,
  ActionMenuButtonProperties,
  ActionMenuState,
  MenuStateType,
} from ".";
import {
  ClientToServerEvent,
  CombatAction,
  CombatantProperties,
  NextOrPrevious,
} from "@speed-dungeon/common";
import { websocketConnection } from "@/singletons/websocket-connection";
import { setAlert } from "@/app/components/alerts";

export class ConsideringCombatActionMenuState implements ActionMenuState {
  page = 1;
  numPages: number = 1;
  type = MenuStateType.CombatActionSelected;
  constructor(public combatAction: CombatAction) {}
  getButtonProperties(): ActionButtonsByCategory {
    const toReturn = new ActionButtonsByCategory();

    const focusedCharacterResult = useGameStore.getState().getFocusedCharacter();
    if (focusedCharacterResult instanceof Error) {
      setAlert(focusedCharacterResult.message);
      return toReturn;
    }
    const { combatantProperties } = focusedCharacterResult;
    const characterId = focusedCharacterResult.entityProperties.id;

    // CANCEL
    const cancelButton = new ActionMenuButtonProperties("Cancel", () => {
      websocketConnection.emit(ClientToServerEvent.SelectCombatAction, {
        characterId,
        combatActionOption: null,
      });
      useGameStore.getState().mutateState((state) => {
        state.stackedMenuStates.pop();
      });
    });

    cancelButton.dedicatedKeys = ["Escape"];
    toReturn[ActionButtonCategory.Top].push(cancelButton);

    // CYCLE BACK
    const previousTargetButton = new ActionMenuButtonProperties("Previous Target (W)", () => {
      websocketConnection.emit(ClientToServerEvent.CycleCombatActionTargets, {
        characterId,
        direction: NextOrPrevious.Previous,
      });
    });
    previousTargetButton.dedicatedKeys = ["KeyW", "ArrowLeft"];
    toReturn[ActionButtonCategory.Bottom].push(previousTargetButton);

    // CYCLE FORWARD
    const nextTargetButton = new ActionMenuButtonProperties("Next Target (E)", () => {
      websocketConnection.emit(ClientToServerEvent.CycleCombatActionTargets, {
        characterId,
        direction: NextOrPrevious.Next,
      });
    });
    nextTargetButton.dedicatedKeys = ["KeyE", "ArrowRight"];
    toReturn[ActionButtonCategory.Bottom].push(nextTargetButton);

    // EXECUTE
    const executeActionButton = new ActionMenuButtonProperties("Execute (R)", () => {
      websocketConnection.emit(ClientToServerEvent.UseSelectedCombatAction, {
        characterId,
      });
      useGameStore.getState().mutateState((state) => {
        state.detailedEntity = null;
        state.hoveredEntity = null;
      });
    });
    executeActionButton.dedicatedKeys = ["Enter", "KeyR"];
    toReturn[ActionButtonCategory.Top].push(executeActionButton);

    // CYCLE SCHEMES

    const combatActionProperties = CombatantProperties.getCombatActionPropertiesIfOwned(
      combatantProperties,
      this.combatAction
    );
    if (combatActionProperties instanceof Error) {
      setAlert(combatActionProperties.message);
      return toReturn;
    }
    if (combatActionProperties.targetingSchemes.length <= 1) return toReturn;

    const cycleTargetingSchemesButton = new ActionMenuButtonProperties(
      "Targeting Scheme (T)",
      () => {
        websocketConnection.emit(ClientToServerEvent.CycleTargetingSchemes, { characterId });
      }
    );
    cycleTargetingSchemesButton.dedicatedKeys = ["KeyT"];
    toReturn[ActionButtonCategory.Top].push(cycleTargetingSchemesButton);

    return toReturn;
  }
}
