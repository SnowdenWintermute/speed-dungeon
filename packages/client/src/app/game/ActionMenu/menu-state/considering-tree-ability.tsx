import { immerable } from "immer";
import { useGameStore } from "@/stores/game-store";
import {
  ActionButtonCategory,
  ActionButtonsByCategory,
  ActionMenuButtonProperties,
  ActionMenuState,
  MenuStateType,
} from ".";
import { createCancelButton } from "./common-buttons/cancel";
import { setAlert } from "@/app/components/alerts";
import { AbilityTreeAbility, ClientToServerEvent } from "@speed-dungeon/common";
import createPageButtons from "./create-page-buttons";
import { websocketConnection } from "@/singletons/websocket-connection";
import { HOTKEYS } from "@/hotkeys";

export class ConsideringCombatantAbilityMenuState implements ActionMenuState {
  [immerable] = true;
  page = 1;
  numPages: number = 1;
  type = MenuStateType.ConsideringAbilityTreeAbility;
  alwaysShowPageOne = true;
  constructor(
    public readonly column: (undefined | AbilityTreeAbility)[],
    public index: number
  ) {
    this.page = index + 1;
    this.numPages = column.length;
  }

  getButtonProperties() {
    const toReturn = new ActionButtonsByCategory();
    toReturn[ActionButtonCategory.Top].push(
      createCancelButton([], () => {
        useGameStore.getState().mutateState((state) => {
          state.detailedCombatantAbility = null;
        });
      })
    );

    const focusedCharacterResult = useGameStore.getState().getFocusedCharacter();
    if (focusedCharacterResult instanceof Error) {
      setAlert(focusedCharacterResult);
      return toReturn;
    }

    const abilityOption = useGameStore.getState().detailedCombatantAbility;
    if (abilityOption === null) throw new Error("expected ability missing");

    const button = new ActionMenuButtonProperties(
      () => (
        <div className="flex justify-between h-full w-full pr-2">
          <div className="flex items-center whitespace-nowrap overflow-hidden overflow-ellipsis flex-1">
            Allocate ability point
          </div>
          <div className="h-full flex items-center">+</div>
        </div>
      ),
      "keyname",
      () => {
        websocketConnection.emit(ClientToServerEvent.AllocateAbilityPoint, {
          characterId: focusedCharacterResult.entityProperties.id,
          ability: abilityOption,
        });
      }
    );

    button.dedicatedKeys = [HOTKEYS.ALT_1];

    button.shouldBeDisabled = focusedCharacterResult.combatantProperties.unspentAbilityPoints <= 0;

    toReturn[ActionButtonCategory.Top].push(button);

    createPageButtons(this, toReturn, this.column.length, (newPage) => {
      useGameStore.getState().mutateState((state) => {
        state.detailedCombatantAbility = this.column[newPage - 1] || null;
      });
    });

    return toReturn;
  }
}
