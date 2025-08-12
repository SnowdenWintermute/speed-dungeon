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
  CombatActionName,
  COMBAT_ACTIONS,
  ACTION_NAMES_TO_HIDE_IN_MENU,
  getUnmetCostResourceTypes,
  COMBATANT_MAX_ACTION_POINTS,
} from "@speed-dungeon/common";
import { websocketConnection } from "@/singletons/websocket-connection";
import { setAlert } from "@/app/components/alerts";
import getCurrentBattleOption from "@/utils/getCurrentBattleOption";
import getGameAndParty from "@/utils/getGameAndParty";
import clientUserControlsCombatant from "@/utils/client-user-controls-combatant";
import { HOTKEYS, letterFromKeyCode } from "@/hotkeys";
import { setInventoryOpen, setViewingAbilityTree } from "./common-buttons/open-inventory";
import { ReactNode } from "react";

import FireIcon from "../../../../../public/img/game-ui-icons/fire.svg";
import RangedIcon from "../../../../../public/img/game-ui-icons/ranged.svg";
import SwordSlashIcon from "../../../../../public/img/game-ui-icons/sword-slash.svg";
import HealthCrossIcon from "../../../../../public/img/game-ui-icons/health-cross.svg";
import IceIcon from "../../../../../public/img/game-ui-icons/ice.svg";
import { toggleAssignAttributesHotkey } from "../../UnspentAttributesButton";
import createPageButtons from "./create-page-buttons";
import { immerable } from "immer";

export const viewItemsOnGroundHotkey = HOTKEYS.ALT_1;

export const VIEW_LOOT_BUTTON_TEXT = `Loot (${letterFromKeyCode(viewItemsOnGroundHotkey)})`;

export class BaseMenuState implements ActionMenuState {
  page = 1;
  numPages: number = 1;
  type = MenuStateType.Base;
  [immerable] = true;
  constructor(public inCombat: boolean) {}
  getButtonProperties(): ActionButtonsByCategory {
    const toReturn = new ActionButtonsByCategory();

    toReturn[ActionButtonCategory.Top].push(setInventoryOpen);
    toReturn[ActionButtonCategory.Top].push(setViewingAbilityTree);

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

    if (combatantProperties.unspentAttributePoints > 0) {
      const hiddenButtonForUnspentAttributesHotkey = new ActionMenuButtonProperties(
        "Unspent Attributes Hotkey Button",
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

    for (const [actionName, actionState] of iterateNumericEnumKeyedRecord(
      combatantProperties.ownedActions
    )) {
      if (ACTION_NAMES_TO_HIDE_IN_MENU.includes(actionName)) continue;
      const nameAsString = COMBAT_ACTION_NAME_STRINGS[actionName];
      const button = new ActionMenuButtonProperties(
        (
          <div className="flex justify-between h-full w-full pr-2">
            <div className="flex items-center whitespace-nowrap overflow-hidden overflow-ellipsis flex-1">
              {nameAsString}
            </div>
            <div className="h-full flex items-center">
              {getActionIcon(actionName, focusedCharacterResult.combatantProperties)}
            </div>
          </div>
        ),
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
        combatAction.name
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

function disableButtonBecauseNotThisCombatantTurn(combatantId: string) {
  const gameOption = useGameStore.getState().game;
  const username = useGameStore.getState().username;
  const gameAndPartyResult = getGameAndParty(gameOption, username);
  if (gameAndPartyResult instanceof Error) return gameAndPartyResult;

  const [game, party] = gameAndPartyResult;

  const battleOptionResult = getCurrentBattleOption(game, party.name);
  let disableButtonBecauseNotThisCombatantTurn = false;

  if (battleOptionResult && !(battleOptionResult instanceof Error)) {
    disableButtonBecauseNotThisCombatantTurn =
      !battleOptionResult.turnOrderManager.combatantIsFirstInTurnOrder(combatantId);
  }

  return disableButtonBecauseNotThisCombatantTurn;
}

function getActionIcon(
  actionName: CombatActionName,
  combatantProperties: CombatantProperties
): ReactNode {
  return <div>icon</div>;
  // switch (abilityName) {
  //   case AbilityName.Attack:
  //   case AbilityName.AttackMeleeMainhand:
  //   case AbilityName.AttackMeleeOffhand:
  //   case AbilityName.AttackRangedMainhand:
  //     const mhOption = CombatantEquipment.getEquippedHoldable(
  //       combatantProperties,
  //       HoldableSlotType.MainHand
  //     );
  //     if (
  //       mhOption &&
  //       mhOption.equipmentBaseItemProperties.equipmentType === EquipmentType.TwoHandedRangedWeapon
  //     ) {
  //       return <RangedIcon className="h-[20px] fill-slate-400 stroke-slate-400" />;
  //     } else {
  //       return <SwordSlashIcon className="h-[20px] fill-slate-400" />;
  //     }
  //   case AbilityName.Fire:
  //     return <FireIcon className="h-[20px] fill-slate-400" />;
  //   case AbilityName.Ice:
  //     return <IceIcon className="h-[20px] fill-slate-400" />;
  //   case AbilityName.Healing:
  //     return <HealthCrossIcon className="h-[20px] fill-slate-400" />;
  //   case AbilityName.Destruction:
  //     return <FireIcon className="h-[20px] fill-slate-400" />;
  // }
}
