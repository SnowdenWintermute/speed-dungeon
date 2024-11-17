import {
  inventoryItemsMenuState,
  assignAttributesMenuState,
  useGameStore,
} from "@/stores/game-store";
import {
  ActionButtonCategory,
  ActionButtonsByCategory,
  ActionMenuButtonProperties,
  ActionMenuState,
  MenuStateType,
} from ".";
import {
  ActionUsableContext,
  Battle,
  ClientToServerEvent,
  CombatActionType,
  CombatantAbility,
  CombatantAbilityName,
  CombatantProperties,
  formatAbilityName,
} from "@speed-dungeon/common";
import { websocketConnection } from "@/singletons/websocket-connection";
import { setAlert } from "@/app/components/alerts";
import getCurrentBattleOption from "@/utils/getCurrentBattleOption";
import getGameAndParty from "@/utils/getGameAndParty";
import cloneDeep from "lodash.clonedeep";
import clientUserControlsCombatant from "@/utils/client-user-controls-combatant";
import { HOTKEYS, letterFromKeyCode } from "@/hotkeys";

export const toggleInventoryHotkey = HOTKEYS.MAIN_1;
export const toggleAssignAttributesHotkey = HOTKEYS.ALT_1;

export class BaseMenuState implements ActionMenuState {
  page = 1;
  numPages: number = 1;
  type = MenuStateType.Base;
  constructor(public inCombat: boolean) {}
  getButtonProperties(): ActionButtonsByCategory {
    const toReturn = new ActionButtonsByCategory();

    const setInventoryOpen = new ActionMenuButtonProperties(
      `Open Inventory (${letterFromKeyCode(toggleInventoryHotkey)})`,
      () => {
        useGameStore.getState().mutateState((state) => {
          state.stackedMenuStates.push(inventoryItemsMenuState);
        });
      }
    );
    setInventoryOpen.dedicatedKeys = ["KeyI", toggleInventoryHotkey];
    toReturn[ActionButtonCategory.Top].push(setInventoryOpen);

    let focusedCharacterResult = useGameStore.getState().getFocusedCharacter();
    if (focusedCharacterResult instanceof Error) {
      setAlert(focusedCharacterResult.message);
      return toReturn;
    }
    const { combatantProperties, entityProperties } = focusedCharacterResult;
    const characterId = entityProperties.id;

    if (focusedCharacterResult.combatantProperties.unspentAttributePoints) {
      const assignAttributesButton = new ActionMenuButtonProperties(
        `Assign Attributes (${letterFromKeyCode(toggleAssignAttributesHotkey)})`,
        () => {
          useGameStore.getState().mutateState((state) => {
            state.stackedMenuStates.push(assignAttributesMenuState);
          });
        }
      );
      assignAttributesButton.dedicatedKeys = ["KeyI", toggleAssignAttributesHotkey];
      toReturn[ActionButtonCategory.Top].push(assignAttributesButton);
    }

    // disabled abilities if not their turn in a battle
    const disabledBecauseNotThisCombatantTurnResult =
      disableButtonBecauseNotThisCombatantTurn(characterId);
    if (disabledBecauseNotThisCombatantTurnResult instanceof Error) {
      console.trace(disabledBecauseNotThisCombatantTurnResult);
      return toReturn;
    }

    const abilitiesNotToMakeButtonsFor = [
      CombatantAbilityName.AttackMeleeOffhand,
      CombatantAbilityName.AttackMeleeMainhand,
      CombatantAbilityName.AttackRangedMainhand,
    ];

    for (const ability of Object.values(combatantProperties.abilities)) {
      if (abilitiesNotToMakeButtonsFor.includes(ability.name)) continue;
      const button = new ActionMenuButtonProperties(formatAbilityName(ability.name), () => {
        websocketConnection.emit(ClientToServerEvent.SelectCombatAction, {
          characterId,
          combatActionOption: { type: CombatActionType.AbilityUsed, abilityName: ability.name },
        });
        useGameStore.getState().mutateState((state) => {
          state.hoveredAction = null;
        });
      });

      button.mouseEnterHandler = button.focusHandler = () =>
        useGameStore.getState().mutateState((state) => {
          state.hoveredAction = cloneDeep({
            type: CombatActionType.AbilityUsed,
            abilityName: ability.name,
          });
        });
      button.mouseLeaveHandler = button.blurHandler = () =>
        useGameStore.getState().mutateState((state) => {
          state.hoveredAction = null;
        });

      const abilityAttributes = CombatantAbility.getAttributes(ability.name);
      const { usabilityContext } = abilityAttributes.combatActionProperties;

      const abilityCostIfOwned = CombatantProperties.getAbilityCostIfOwned(
        combatantProperties,
        ability.name
      );
      const notEnoughMana =
        abilityCostIfOwned instanceof Error || combatantProperties.mana < abilityCostIfOwned;

      const userControlsThisCharacter = clientUserControlsCombatant(characterId);

      button.shouldBeDisabled =
        (usabilityContext === ActionUsableContext.InCombat && !this.inCombat) ||
        (usabilityContext === ActionUsableContext.OutOfCombat && this.inCombat) ||
        notEnoughMana ||
        disabledBecauseNotThisCombatantTurnResult ||
        !userControlsThisCharacter;

      toReturn[ActionButtonCategory.Numbered].push(button);
    }

    return toReturn;
  }
}

function disableButtonBecauseNotThisCombatantTurn(combatantId: string) {
  const gameOption = useGameStore.getState().game;
  const username = useGameStore.getState().username;
  const gameAndPartyResult = getGameAndParty(gameOption, username);
  if (gameAndPartyResult instanceof Error) return gameAndPartyResult;

  const [game, party] = gameAndPartyResult;

  const battleOptionResult = getCurrentBattleOption(game, party.name);
  let disableButtonBecauseNotThisCombatantTurn = false;

  if (battleOptionResult && !(battleOptionResult instanceof Error)) {
    disableButtonBecauseNotThisCombatantTurn = !Battle.combatantIsFirstInTurnOrder(
      battleOptionResult,
      combatantId
    );
  }

  return disableButtonBecauseNotThisCombatantTurn;
}
