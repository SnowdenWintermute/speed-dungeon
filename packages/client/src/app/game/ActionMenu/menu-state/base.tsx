import {
  useGameStore,
  itemsOnGroundMenuState,
  assignAttributesMenuState,
} from "@/stores/game-store";
import {
  ActionButtonCategory,
  ActionButtonsByCategory,
  ActionMenuButtonProperties,
  ActionMenuState,
  MenuStateType,
} from ".";
import {
  ClientToServerEvent,
  CombatantProperties,
  Inventory,
  CombatActionUsabilityContext,
  iterateNumericEnumKeyedRecord,
  COMBAT_ACTION_NAME_STRINGS,
  COMBAT_ACTIONS,
  ACTION_NAMES_TO_HIDE_IN_MENU,
  getUnmetCostResourceTypes,
  AbilityType,
  CombatActionName,
} from "@speed-dungeon/common";
import { websocketConnection } from "@/singletons/websocket-connection";
import { setAlert } from "@/app/components/alerts";
import getCurrentBattleOption from "@/utils/getCurrentBattleOption";
import getGameAndParty from "@/utils/getGameAndParty";
import clientUserControlsCombatant from "@/utils/client-user-controls-combatant";
import { HOTKEYS, letterFromKeyCode } from "@/hotkeys";
import {
  setInventoryOpen,
  setViewingAbilityTreeAsFreshStack,
} from "./common-buttons/open-inventory";
import { toggleAssignAttributesHotkey } from "../../UnspentAttributesButton";
import createPageButtons from "./create-page-buttons";
import { immerable } from "immer";
import {
  ACTION_ICONS,
  getAttackActionIcons,
} from "../../character-sheet/ability-tree/action-icons";

export const viewItemsOnGroundHotkey = HOTKEYS.ALT_1;

export const VIEW_LOOT_BUTTON_TEXT = `Loot (${letterFromKeyCode(viewItemsOnGroundHotkey)})`;

export class BaseMenuState implements ActionMenuState {
  page = 1;
  numPages: number = 1;
  type = MenuStateType.Base;
  alwaysShowPageOne = false;

  getCenterInfoDisplayOption = null;
  [immerable] = true;
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

    toReturn[ActionButtonCategory.Top].push(setViewingAbilityTreeAsFreshStack);

    const partyResult = useGameStore.getState().getParty();
    if (partyResult instanceof Error) {
      setAlert(partyResult);
      return toReturn;
    }

    if (combatantProperties.unspentAttributePoints > 0) {
      const hiddenButtonForUnspentAttributesHotkey = new ActionMenuButtonProperties(
        () => "Unspent Attributes Hotkey Button",
        "Unspent Attributes Hotkey Button",
        () => {
          useGameStore.getState().mutateState((state) => {
            state.hoveredAction = null;
            state.stackedMenuStates.push(assignAttributesMenuState);
          });
        }
      );
      hiddenButtonForUnspentAttributesHotkey.dedicatedKeys = [toggleAssignAttributesHotkey];
      toReturn[ActionButtonCategory.Hidden].push(hiddenButtonForUnspentAttributesHotkey);
    }

    if (Inventory.getItems(partyResult.currentRoom.inventory).length) {
      const viewItemsOnGroundButton = new ActionMenuButtonProperties(
        () => VIEW_LOOT_BUTTON_TEXT,
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

    for (const [actionName, actionState] of iterateNumericEnumKeyedRecord(
      combatantProperties.abilityProperties.ownedActions
    )) {
      if (ACTION_NAMES_TO_HIDE_IN_MENU.includes(actionName)) continue;
      const nameAsString = COMBAT_ACTION_NAME_STRINGS[actionName];
      const button = new ActionMenuButtonProperties(
        () => {
          let icons = [ACTION_ICONS[actionName]];

          if (actionName === CombatActionName.Attack) {
            const { mhIcons, ohIcons } = getAttackActionIcons(combatantProperties);
          }

          return (
            <div className="flex justify-between h-full w-full pr-2">
              <div className="flex items-center whitespace-nowrap overflow-hidden overflow-ellipsis flex-1">
                {nameAsString}
              </div>
              <div className="h-full flex items-center p-2">
                {icons.map((iconGetterOption, i) => {
                  if (iconGetterOption === null) return "icon missing";
                  return (
                    <div className="h-full" key={i}>
                      {" "}
                      {iconGetterOption("h-full fill-slate-400 stroke-slate-400")}{" "}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        },
        nameAsString,
        () => {
          websocketConnection.emit(ClientToServerEvent.SelectCombatAction, {
            characterId,
            combatActionNameOption: actionName,
            combatActionLevel: actionState.level,
          });
          useGameStore.getState().mutateState((state) => {
            state.hoveredAction = null;
          });
        }
      );

      button.mouseEnterHandler = button.focusHandler = () =>
        useGameStore.getState().mutateState((state) => {
          state.hoveredAction = actionName;
        });
      button.mouseLeaveHandler = button.blurHandler = () =>
        useGameStore.getState().mutateState((state) => {
          state.hoveredAction = null;
        });

      const combatAction = COMBAT_ACTIONS[actionName];
      const { usabilityContext } = combatAction.targetingProperties;

      const costs = combatAction.costProperties.getResourceCosts(
        combatantProperties,
        this.inCombat,
        1 // @TODO - calculate the actual level to display based on most expensive they can afford
      );
      let unmetCosts = [];
      if (costs) unmetCosts = getUnmetCostResourceTypes(combatantProperties, costs);

      const userControlsThisCharacter = clientUserControlsCombatant(characterId);

      const isWearingRequiredEquipment = CombatantProperties.isWearingRequiredEquipmentToUseAction(
        combatantProperties,
        combatAction.name,
        1
      );

      const isOnCooldown = (actionState.cooldown?.current || 0) > 0;

      button.shouldBeDisabled =
        (usabilityContext === CombatActionUsabilityContext.InCombat && !this.inCombat) ||
        (usabilityContext === CombatActionUsabilityContext.OutOfCombat && this.inCombat) ||
        isOnCooldown ||
        !isWearingRequiredEquipment ||
        unmetCosts.length > 0 ||
        disabledBecauseNotThisCombatantTurnResult ||
        !userControlsThisCharacter;

      toReturn[ActionButtonCategory.Numbered].push(button);
    }

    createPageButtons(this, toReturn);

    return toReturn;
  }
}

export function disableButtonBecauseNotThisCombatantTurn(combatantId: string) {
  const gameOption = useGameStore.getState().game;
  const username = useGameStore.getState().username;
  const gameAndPartyResult = getGameAndParty(gameOption, username);
  if (gameAndPartyResult instanceof Error) throw gameAndPartyResult;

  const [game, party] = gameAndPartyResult;

  const battleOptionResult = getCurrentBattleOption(game, party.name);
  let disableButtonBecauseNotThisCombatantTurn = false;

  if (battleOptionResult && !(battleOptionResult instanceof Error)) {
    disableButtonBecauseNotThisCombatantTurn =
      !battleOptionResult.turnOrderManager.combatantIsFirstInTurnOrder(combatantId);
  }

  return disableButtonBecauseNotThisCombatantTurn;
}
