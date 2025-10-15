import { useGameStore } from "@/stores/game-store";
import { ActionMenuState } from ".";
import {
  ClientToServerEvent,
  CombatActionName,
  CombatantProperties,
  InputLock,
  NextOrPrevious,
} from "@speed-dungeon/common";
import { websocketConnection } from "@/singletons/websocket-connection";
import { setAlert } from "@/app/components/alerts";
import { clientUserControlsCombatant } from "@/utils/client-user-controls-combatant";
import { HOTKEYS, letterFromKeyCode } from "@/hotkeys";
import { createCancelButton } from "./common-buttons/cancel";
import getCurrentParty from "@/utils/getCurrentParty";
import { AppStore } from "@/mobx-stores/app-store";
import { ActionMenuButtonProperties } from "./action-menu-button-properties";
import { MenuStateType } from "./menu-state-type";
import { ActionButtonCategory, ActionButtonsByCategory } from "./action-buttons-by-category";

export const executeHotkey = HOTKEYS.MAIN_1;
export const EXECUTE_BUTTON_TEXT = `Execute (${letterFromKeyCode(executeHotkey)})`;

export class ConsideringCombatActionMenuState extends ActionMenuState {
  constructor(public combatActionName: CombatActionName) {
    super(MenuStateType.CombatActionSelected, 1);
  }
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
        actionAndRankOption: null,
      });
    });
    toReturn[ActionButtonCategory.Top].push(cancelButton);

    // CYCLE BACK
    const prevHotkey = HOTKEYS.LEFT_MAIN;
    const previousTargetButton = new ActionMenuButtonProperties(
      () => `Previous Target (${letterFromKeyCode(prevHotkey)})`,
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
      () => `Next Target (${letterFromKeyCode(nextHotkey)})`,
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
      () => EXECUTE_BUTTON_TEXT,
      EXECUTE_BUTTON_TEXT,
      () => {
        websocketConnection.emit(ClientToServerEvent.UseSelectedCombatAction, {
          characterId,
        });

        const { focusStore, actionMenuStore } = AppStore.get();
        focusStore.detailable.clear();

        actionMenuStore.clearStack();
        actionMenuStore.getCurrentMenu().goToFirstPage();

        useGameStore.getState().mutateState((state) => {
          const partyOption = getCurrentParty(state, state.username || "");
          if (partyOption) {
            const focusedCharacter = AppStore.get().gameStore.getExpectedFocusedCharacter();
            focusedCharacter.getTargetingProperties().setSelectedActionAndRank(null);
            InputLock.lockInput(partyOption.inputLock);
          }
        });
      }
    );
    executeActionButton.dedicatedKeys = ["Enter", executeHotkey];

    const userControlsThisCharacter = clientUserControlsCombatant(characterId);
    executeActionButton.shouldBeDisabled = !userControlsThisCharacter;

    toReturn[ActionButtonCategory.Top].push(executeActionButton);

    // CYCLE SCHEMES
    //
    const selectedActionAndRank =
      combatantProperties.targetingProperties.getSelectedActionAndRank();
    if (selectedActionAndRank === null) {
      return toReturn;
    }

    const combatActionProperties = CombatantProperties.getCombatActionPropertiesIfOwned(
      combatantProperties,
      selectedActionAndRank
    );

    if (combatActionProperties instanceof Error) {
      setAlert(combatActionProperties);
      return toReturn;
    }

    const { targetingProperties } = combatActionProperties;
    const noTargetingSchemesExist =
      targetingProperties.getTargetingSchemes(selectedActionAndRank.rank).length <= 1;
    if (noTargetingSchemesExist) {
      return toReturn;
    }

    const targetingSchemeHotkey = HOTKEYS.MAIN_2;
    const cycleTargetingSchemesButton = new ActionMenuButtonProperties(
      () => `Targeting Scheme (${letterFromKeyCode(targetingSchemeHotkey)})`,
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
