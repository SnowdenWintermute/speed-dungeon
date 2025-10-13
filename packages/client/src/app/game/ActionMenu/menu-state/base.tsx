import { useGameStore } from "@/stores/game-store";
import { ActionMenuState } from ".";
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
  CombatActionName,
  ActionAndRank,
} from "@speed-dungeon/common";
import { websocketConnection } from "@/singletons/websocket-connection";
import { setAlert } from "@/app/components/alerts";
import getCurrentBattleOption from "@/utils/getCurrentBattleOption";
import getGameAndParty from "@/utils/getGameAndParty";
import { clientUserControlsCombatant } from "@/utils/client-user-controls-combatant";
import { HOTKEYS, letterFromKeyCode } from "@/hotkeys";
import {
  setInventoryOpen,
  setViewingAbilityTreeAsFreshStack,
} from "./common-buttons/open-inventory";
import { toggleAssignAttributesHotkey } from "../../UnspentAttributesButton";
import { createPageButtons } from "./create-page-buttons";
import { getAttackActionIcons } from "../../character-sheet/ability-tree/action-icons";
import { ACTION_ICONS } from "@/app/icons";
import { AppStore } from "@/mobx-stores/app-store";
import { MENU_STATE_POOL } from "@/mobx-stores/action-menu/menu-state-pool";
import { ActionMenuButtonProperties } from "./action-menu-button-properties";
import { MenuStateType } from "./menu-state-type";
import { ActionButtonCategory, ActionButtonsByCategory } from "./action-buttons-by-category";

export const viewItemsOnGroundHotkey = HOTKEYS.ALT_1;

export const VIEW_LOOT_BUTTON_TEXT = `Loot (${letterFromKeyCode(viewItemsOnGroundHotkey)})`;

export class BaseMenuState extends ActionMenuState {
  constructor() {
    super(MenuStateType.Base, 1);
  }

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
          const { actionMenuStore } = AppStore.get();
          actionMenuStore.hoveredAction = null;
          actionMenuStore.pushStack(MENU_STATE_POOL.get(MenuStateType.AssignAttributePoints));
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
          AppStore.get().actionMenuStore.hoveredAction = null;
          AppStore.get().actionMenuStore.pushStack(
            MENU_STATE_POOL.get(MenuStateType.ItemsOnGround)
          );
        }
      );
      viewItemsOnGroundButton.dedicatedKeys = [viewItemsOnGroundHotkey];
      toReturn[ActionButtonCategory.Top].push(viewItemsOnGroundButton);
    }

    // disabled abilities if not their turn in a battle
    const disabledBecauseNotThisCombatantTurnResult =
      disableButtonBecauseNotThisCombatantTurn(characterId);

    const inCombat = partyResult.combatantManager.monstersArePresent();

    for (const [actionName, actionState] of iterateNumericEnumKeyedRecord(
      combatantProperties.abilityProperties.ownedActions
    )) {
      if (ACTION_NAMES_TO_HIDE_IN_MENU.includes(actionName)) continue;
      const nameAsString = COMBAT_ACTION_NAME_STRINGS[actionName];
      const button = new ActionMenuButtonProperties(
        () => {
          const standardActionIcon = ACTION_ICONS[actionName];

          let isAttack = actionName === CombatActionName.Attack;
          let mainHandIcons = [];
          let offHandIcons = [];
          let ohDisabledStyle = "";
          if (isAttack) {
            const { mhIcons, ohIcons, ohDisabled } = getAttackActionIcons(
              combatantProperties,
              inCombat
            );
            mainHandIcons.push(...mhIcons);
            offHandIcons.push(...ohIcons);
            if (ohDisabled) ohDisabledStyle = "opacity-50";
          }

          return (
            <div className="flex justify-between h-full w-full pr-2">
              <div className="flex items-center whitespace-nowrap overflow-hidden overflow-ellipsis flex-1">
                {nameAsString}
              </div>
              <div className="h-full flex items-center p-2">
                {isAttack ? (
                  <div className="h-full flex">
                    <div className="h-full flex">
                      {mainHandIcons.map((iconGetter, i) => (
                        <div key={"mh-" + i} className="h-full mr-1 last:mr-0">
                          {iconGetter("h-full fill-slate-400 stroke-slate-400")}
                        </div>
                      ))}
                    </div>
                    {!!(offHandIcons.length > 0) && <div className="mx-1">/</div>}

                    <div className={"h-full flex"}>
                      {offHandIcons.map((iconGetter, i) => (
                        <div key={"mh-" + i} className={`h-full mr-1 last:mr-0 ${ohDisabledStyle}`}>
                          {iconGetter("h-full fill-slate-400 stroke-slate-400")}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-full">
                    {standardActionIcon === null
                      ? "icon missing"
                      : standardActionIcon("h-full fill-slate-400 stroke-slate-400")}{" "}
                  </div>
                )}
              </div>
            </div>
          );
        },
        nameAsString,
        () => {
          console.log(
            "SelectCombatAction for entity:",
            characterId,
            "actionAndRankOption:",
            actionName,
            1
          );
          websocketConnection.emit(ClientToServerEvent.SelectCombatAction, {
            characterId,
            actionAndRankOption: new ActionAndRank(actionName, 1),
          });

          AppStore.get().actionMenuStore.hoveredAction = null;
        }
      );

      button.mouseEnterHandler = button.focusHandler = () => {
        AppStore.get().actionMenuStore.hoveredAction = null;
      };
      button.mouseLeaveHandler = button.blurHandler = () => {
        AppStore.get().actionMenuStore.hoveredAction = null;
      };

      const combatAction = COMBAT_ACTIONS[actionName];
      const { usabilityContext } = combatAction.targetingProperties;

      const costs = combatAction.costProperties.getResourceCosts(
        focusedCharacterResult,
        inCombat,
        1 // @TODO - calculate the actual level to display based on most expensive they can afford
      );
      let unmetCosts = [];
      if (costs) unmetCosts = getUnmetCostResourceTypes(combatantProperties, costs);

      const userControlsThisCharacter = clientUserControlsCombatant(characterId);

      const isWearingRequiredEquipment = CombatantProperties.isWearingRequiredEquipmentToUseAction(
        combatantProperties,
        new ActionAndRank(actionName, 1)
      );

      const isOnCooldown = (actionState.cooldown?.current || 0) > 0;

      button.shouldBeDisabled =
        (usabilityContext === CombatActionUsabilityContext.InCombat && !inCombat) ||
        (usabilityContext === CombatActionUsabilityContext.OutOfCombat && inCombat) ||
        isOnCooldown ||
        !isWearingRequiredEquipment ||
        unmetCosts.length > 0 ||
        disabledBecauseNotThisCombatantTurnResult ||
        !userControlsThisCharacter;

      toReturn[ActionButtonCategory.Numbered].push(button);
    }

    createPageButtons(toReturn);

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
