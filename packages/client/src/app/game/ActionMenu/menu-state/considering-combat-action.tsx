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
  CombatActionName,
  CombatantProperties,
  InputLock,
  NextOrPrevious,
} from "@speed-dungeon/common";
import { websocketConnection } from "@/singletons/websocket-connection";
import { setAlert } from "@/app/components/alerts";
import clientUserControlsCombatant from "@/utils/client-user-controls-combatant";
import { HOTKEYS, letterFromKeyCode } from "@/hotkeys";
import getCurrentParty from "@/utils/getCurrentParty";
import { createCancelButton } from "./common-buttons/cancel";

export const executeHotkey = HOTKEYS.MAIN_1;
export const EXECUTE_BUTTON_TEXT = `Execute (${letterFromKeyCode(executeHotkey)})`;

export class ConsideringCombatActionMenuState implements ActionMenuState {
  page = 1;
  numPages: number = 1;
  type = MenuStateType.CombatActionSelected;
  constructor(public combatActionName: CombatActionName) {}
  getButtonProperties(): ActionButtonsByCategory {
    const toReturn = new ActionButtonsByCategory();

    const focusedCharacterResult = useGameStore.getState().getFocusedCharacter();
    if (focusedCharacterResult instanceof Error) {
      setAlert(focusedCharacterResult);
      return toReturn;
    }
    const { combatantProperties } = focusedCharacterResult;
    const characterId = focusedCharacterResult.entityProperties.id;

    const cancelButton = createCancelButton([], () => {
      websocketConnection.emit(ClientToServerEvent.SelectCombatAction, {
        characterId,
        combatActionNameOption: null,
      });
    });
    toReturn[ActionButtonCategory.Top].push(cancelButton);

    // CYCLE BACK
    const prevHotkey = HOTKEYS.LEFT_MAIN;
    const previousTargetButton = new ActionMenuButtonProperties(
      `Previous Target (${letterFromKeyCode(prevHotkey)})`,
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
    const executeActionButton = new ActionMenuButtonProperties(
      EXECUTE_BUTTON_TEXT,
      EXECUTE_BUTTON_TEXT,
      () => {
        websocketConnection.emit(ClientToServerEvent.UseSelectedCombatAction, {
          characterId,
        });
        useGameStore.getState().mutateState((state) => {
          state.detailedEntity = null;
          state.hoveredEntity = null;

          // it should theoretically be unlocked after their action resolves
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
      this.combatActionName
    );
    if (combatActionProperties instanceof Error) {
      setAlert(combatActionProperties);
      return toReturn;
    }
    if (combatActionProperties.targetingSchemes.length <= 1) return toReturn;

    const targetingSchemeHotkey = HOTKEYS.MAIN_2;
    const cycleTargetingSchemesButton = new ActionMenuButtonProperties(
      `Targeting Scheme (${letterFromKeyCode(targetingSchemeHotkey)})`,
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
