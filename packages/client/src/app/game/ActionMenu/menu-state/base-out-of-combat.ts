import { inventoryItemsMenuState, useGameStore } from "@/stores/game-store";
import {
  ActionButtonCategory,
  ActionButtonsByCategory,
  ActionMenuButtonProperties,
  ActionMenuState,
  MenuStateType,
} from ".";
import {
  ActionUsableContext,
  ClientToServerEvent,
  CombatActionType,
  CombatantAbility,
  formatAbilityName,
} from "@speed-dungeon/common";
import { websocketConnection } from "@/singletons/websocket-connection";
import { setAlert } from "@/app/components/alerts";

export class BaseOutOfCombatMenuState implements ActionMenuState {
  page = 1;
  numPages: number = 1;
  type = MenuStateType.BaseOutOfCombat;
  constructor() {}
  getButtonProperties(): ActionButtonsByCategory {
    const toReturn = new ActionButtonsByCategory();

    const setInventoryOpen = new ActionMenuButtonProperties("Open Inventory", () => {
      useGameStore.getState().mutateState((state) => {
        state.menuState = inventoryItemsMenuState;
      });
    });
    setInventoryOpen.dedicatedKeys = ["KeyI", "KeyS"];
    toReturn[ActionButtonCategory.Top].push(setInventoryOpen);

    const toggleReadyToExplore = new ActionMenuButtonProperties("Ready to explore", () => {
      websocketConnection.emit(ClientToServerEvent.ToggleReadyToExplore);
    });
    toReturn[ActionButtonCategory.Numbered].push(toggleReadyToExplore);

    let focusedCharacterResult = useGameStore.getState().getFocusedCharacter();
    if (focusedCharacterResult instanceof Error) {
      setAlert(focusedCharacterResult.message);
      return toReturn;
    }
    const { combatantProperties, entityProperties } = focusedCharacterResult;
    const characterId = entityProperties.id;

    for (const ability of Object.values(combatantProperties.abilities)) {
      const abilityAttributes = CombatantAbility.getAttributes(ability.name);
      const { usabilityContext } = abilityAttributes.combatActionProperties;
      if (usabilityContext === ActionUsableContext.InCombat) continue;

      const button = new ActionMenuButtonProperties(formatAbilityName(ability.name), () => {
        websocketConnection.emit(ClientToServerEvent.SelectCombatAction, {
          characterId,
          combatActionOption: { type: CombatActionType.AbilityUsed, abilityName: ability.name },
        });
      });
      toReturn[ActionButtonCategory.Numbered].push(button);
    }

    // gameActions.push({
    //   type: GameActionType.SetAssignAttributePointsMenuOpen,
    //   shouldBeOpen: true,
    // });
    return toReturn;
  }
}
