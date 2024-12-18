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
import clientUserControlsCombatant from "@/utils/client-user-controls-combatant";
import { HOTKEYS, letterFromKeyCode } from "@/hotkeys";

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
    const prevHotkey = HOTKEYS.LEFT_MAIN;
    const previousTargetButton = new ActionMenuButtonProperties(
      `Previous Target (${letterFromKeyCode(prevHotkey)})`,
      () => {
        websocketConnection.emit(ClientToServerEvent.CycleCombatActionTargets, {
          characterId,
          direction: NextOrPrevious.Previous,
        });
      }
    );
    previousTargetButton.dedicatedKeys = [prevHotkey, "ArrowLeft"];
    toReturn[ActionButtonCategory.Bottom].push(previousTargetButton);

    // CYCLE FORWARD
    const nextHotkey = HOTKEYS.RIGHT_MAIN;
    const nextTargetButton = new ActionMenuButtonProperties(
      `Next Target (${letterFromKeyCode(nextHotkey)})`,
      () => {
        websocketConnection.emit(ClientToServerEvent.CycleCombatActionTargets, {
          characterId,
          direction: NextOrPrevious.Next,
        });
      }
    );
    nextTargetButton.dedicatedKeys = [nextHotkey, "ArrowRight"];
    toReturn[ActionButtonCategory.Bottom].push(nextTargetButton);

    // EXECUTE
    const executeHotkey = HOTKEYS.MAIN_1;
    const executeActionButton = new ActionMenuButtonProperties(
      `Execute (${letterFromKeyCode(executeHotkey)})`,
      () => {
        websocketConnection.emit(ClientToServerEvent.UseSelectedCombatAction, {
          characterId,
        });
        useGameStore.getState().mutateState((state) => {
          state.detailedEntity = null;
          state.hoveredEntity = null;
        });
      }
    );
    executeActionButton.dedicatedKeys = ["Enter", executeHotkey];

    const userControlsThisCharacter = clientUserControlsCombatant(characterId);
    executeActionButton.shouldBeDisabled = !userControlsThisCharacter;

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

    const targetingSchemeHotkey = HOTKEYS.MAIN_2;
    const cycleTargetingSchemesButton = new ActionMenuButtonProperties(
      `Targeting Scheme (${letterFromKeyCode(targetingSchemeHotkey)})`,
      () => {
        websocketConnection.emit(ClientToServerEvent.CycleTargetingSchemes, { characterId });
      }
    );
    cycleTargetingSchemesButton.dedicatedKeys = [targetingSchemeHotkey];
    toReturn[ActionButtonCategory.Top].push(cycleTargetingSchemesButton);

    return toReturn;
  }
}
