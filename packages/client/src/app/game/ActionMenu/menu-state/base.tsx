import { inventoryItemsMenuState, useGameStore, itemsOnGroundMenuState } from "@/stores/game-store";
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
  AbilityName,
  CombatantProperties,
  ABILITY_NAME_STRINGS,
  Inventory,
} from "@speed-dungeon/common";
import { websocketConnection } from "@/singletons/websocket-connection";
import { setAlert } from "@/app/components/alerts";
import getCurrentBattleOption from "@/utils/getCurrentBattleOption";
import getGameAndParty from "@/utils/getGameAndParty";
import cloneDeep from "lodash.clonedeep";
import clientUserControlsCombatant from "@/utils/client-user-controls-combatant";
import { HOTKEYS, letterFromKeyCode } from "@/hotkeys";
import { ABILITY_ATTRIBUTES } from "@speed-dungeon/common";
import { setInventoryOpen } from "./common-buttons/open-inventory";

export const viewItemsOnGroundHotkey = HOTKEYS.ALT_1;

export const VIEW_LOOT_BUTTON_TEXT = `Loot (${letterFromKeyCode(viewItemsOnGroundHotkey)})`;

export class BaseMenuState implements ActionMenuState {
  page = 1;
  numPages: number = 1;
  type = MenuStateType.Base;
  constructor(public inCombat: boolean) {}
  getButtonProperties(): ActionButtonsByCategory {
    const toReturn = new ActionButtonsByCategory();

    toReturn[ActionButtonCategory.Top].push(setInventoryOpen);

    let focusedCharacterResult = useGameStore.getState().getFocusedCharacter();
    if (focusedCharacterResult instanceof Error) {
      setAlert(focusedCharacterResult);
      return toReturn;
    }
    const { combatantProperties, entityProperties } = focusedCharacterResult;
    const characterId = entityProperties.id;

    const partyResult = useGameStore.getState().getParty();
    if (partyResult instanceof Error) {
      setAlert(partyResult);
      return toReturn;
    }

    if (Inventory.getItems(partyResult.currentRoom.inventory).length) {
      const viewItemsOnGroundButton = new ActionMenuButtonProperties(
        VIEW_LOOT_BUTTON_TEXT,
        VIEW_LOOT_BUTTON_TEXT,
        () => {
          useGameStore.getState().mutateState((state) => {
            state.hoveredAction = null;
            state.stackedMenuStates.push(itemsOnGroundMenuState);
          });
        }
      );
      viewItemsOnGroundButton.dedicatedKeys = [viewItemsOnGroundHotkey];
      toReturn[ActionButtonCategory.Top].push(viewItemsOnGroundButton);
    }

    // disabled abilities if not their turn in a battle
    const disabledBecauseNotThisCombatantTurnResult =
      disableButtonBecauseNotThisCombatantTurn(characterId);
    if (disabledBecauseNotThisCombatantTurnResult instanceof Error) {
      console.trace(disabledBecauseNotThisCombatantTurnResult);
      return toReturn;
    }

    const abilitiesNotToMakeButtonsFor = [
      AbilityName.AttackMeleeOffhand,
      AbilityName.AttackMeleeMainhand,
      AbilityName.AttackRangedMainhand,
    ];

    for (const ability of Object.values(combatantProperties.abilities)) {
      if (abilitiesNotToMakeButtonsFor.includes(ability.name)) continue;
      const button = new ActionMenuButtonProperties(
        ABILITY_NAME_STRINGS[ability.name],
        ABILITY_NAME_STRINGS[ability.name],
        () => {
          websocketConnection.emit(ClientToServerEvent.SelectCombatAction, {
            characterId,
            combatActionOption: { type: CombatActionType.AbilityUsed, abilityName: ability.name },
          });
          useGameStore.getState().mutateState((state) => {
            state.hoveredAction = null;
          });
        }
      );

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

      const abilityAttributes = ABILITY_ATTRIBUTES[ability.name];
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
