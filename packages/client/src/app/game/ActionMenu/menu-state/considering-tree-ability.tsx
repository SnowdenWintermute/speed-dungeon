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
import {
  ABILITY_TREES,
  AbilityTreeAbility,
  AbilityUtils,
  ClientToServerEvent,
  CombatantAbilityProperties,
} from "@speed-dungeon/common";
import createPageButtons from "./create-page-buttons";
import { websocketConnection } from "@/singletons/websocket-connection";
import { HOTKEYS, letterFromKeyCode } from "@/hotkeys";

const allocateAbilityPointHotkey = HOTKEYS.MAIN_1;

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
            Allocate point ({letterFromKeyCode(allocateAbilityPointHotkey)})
          </div>
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

    button.dedicatedKeys = [allocateAbilityPointHotkey];

    const isMainClassAbility = AbilityUtils.abilityAppearsInTree(
      abilityOption,
      ABILITY_TREES[focusedCharacterResult.combatantProperties.combatantClass]
    );
    const { canAllocate } = CombatantAbilityProperties.canAllocateAbilityPoint(
      focusedCharacterResult.combatantProperties,
      abilityOption,
      !isMainClassAbility
    );

    button.shouldBeDisabled = !canAllocate;

    toReturn[ActionButtonCategory.Top].push(button);

    createPageButtons(this, toReturn, this.column.length, (newPage) => {
      useGameStore.getState().mutateState((state) => {
        state.detailedCombatantAbility = this.column[newPage - 1] || null;
      });
    });

    return toReturn;
  }
}
