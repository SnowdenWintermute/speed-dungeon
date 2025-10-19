import { BUTTON_HEIGHT, SPACING_REM, SPACING_REM_SMALL } from "@/client_consts";
import React, { ReactNode, useEffect } from "react";
import {
  ConsideringCombatActionMenuState,
  EXECUTE_BUTTON_TEXT,
} from "./menu-state/considering-combat-action";
import ActionMenuDedicatedButton from "./action-menu-buttons/ActionMenuDedicatedButton";
import { NumberedButton } from "./action-menu-buttons/NumberedButton";
import { COMBATANT_MAX_ACTION_POINTS } from "@speed-dungeon/common";
import { HOTKEYS } from "@/hotkeys";
import { VIEW_LOOT_BUTTON_TEXT } from "./menu-state/base";
import {
  ConsideringItemMenuState,
  EQUIP_ITEM_BUTTON_TEXT,
  USE_CONSUMABLE_BUTTON_TEXT,
} from "./menu-state/considering-item";
import { ItemDetailsWithComparison } from "../ItemDetailsWithComparison";
import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import {
  CONFIRM_SHARD_TEXT,
  ConfirmConvertToShardsMenuState,
} from "./menu-state/confirm-convert-to-shards";
import { CharacterFocusingButtons } from "./CycleCharacterFocusButtons";
import { BottomButtons } from "./BottomButtons";
import { ConfirmShardConversionDisplay } from "./ConfirmShardConversionDisplay";
import { ConsideringItemDisplay } from "./ConsideringItemDisplay";
import { VendingMachineShardDisplay } from "./VendingMachineShardDisplay";
import { StackedMenuStateDisplay } from "./StackedMenuStateDisplay";
import HoverableTooltipWrapper from "@/app/components/atoms/HoverableTooltipWrapper";
import { observer } from "mobx-react-lite";
import { AppStore } from "@/mobx-stores/app-store";
import { MenuStateType } from "./menu-state/menu-state-type";
import { ActionButtonCategory } from "./menu-state/action-buttons-by-category";
import { ACTION_MENU_PAGE_SIZE } from "./menu-state";
import { ActionSelectedDetails } from "../detailables/action-details/ActionSelectedDetails";
import { ActionDetails } from "../detailables/action-details";

const topButtonLiStyle = { marginRight: `${SPACING_REM}rem` };
export const SHARD_ITEM_HOTKEY = HOTKEYS.SIDE_2;

const buttonTitlesToAccent = [
  VIEW_LOOT_BUTTON_TEXT,
  EXECUTE_BUTTON_TEXT,
  USE_CONSUMABLE_BUTTON_TEXT,
  EQUIP_ITEM_BUTTON_TEXT,
  CONFIRM_SHARD_TEXT,
];

export const ActionMenu = observer(({ inputLocked }: { inputLocked: boolean }) => {
  const { focusStore, actionMenuStore, gameStore } = AppStore.get();
  const { hoveredItem, detailedItem } = focusStore.getFocusedItems();
  const hoveredAction = actionMenuStore.getHoveredAction();

  const currentMenu = actionMenuStore.getCurrentMenu();
  const currentPageIndex = currentMenu.pageIndex;
  const buttonProperties = currentMenu.buttonProperties;
  const numberOfNumberedButtons = buttonProperties[ActionButtonCategory.Numbered].length;
  const viewingCharacterSheet = actionMenuStore.shouldShowCharacterSheet();
  const focusedCharacter = gameStore.getExpectedFocusedCharacter();
  const party = gameStore.getExpectedParty();

  useEffect(() => {
    if (currentMenu.type === MenuStateType.ItemsOnGround && numberOfNumberedButtons === 0) {
      actionMenuStore.popStack();
    }
  }, [currentMenu.type, numberOfNumberedButtons]);

  if (inputLocked) return <div />;

  let selectedActionDisplay = <></>;
  if (currentMenu instanceof ConsideringCombatActionMenuState) {
    selectedActionDisplay = (
      <div
        className="border border-slate-400 bg-slate-700 min-w-[25rem] max-w-[25rem] p-2 flex"
        style={{ height: `${BUTTON_HEIGHT * ACTION_MENU_PAGE_SIZE}rem` }}
      >
        <ActionSelectedDetails actionName={currentMenu.combatActionName} />
      </div>
    );
  }

  let detailedItemDisplay = <></>;
  if (currentMenu instanceof ConsideringItemMenuState)
    detailedItemDisplay = <ConsideringItemDisplay />;

  if (currentMenu instanceof ConfirmConvertToShardsMenuState)
    detailedItemDisplay = <ConfirmShardConversionDisplay />;

  let hoveredActionDisplay: ReactNode | null = null;
  if (hoveredAction !== null) {
    hoveredActionDisplay = (
      <div className="pl-2">
        <div className="border border-slate-400 bg-slate-700 min-w-[25rem] max-w-[25rem] p-2">
          <ActionDetails actionName={hoveredAction} />
        </div>
      </div>
    );
  }

  let hoveredItemDisplay: ReactNode | null = (
    <div
      style={{
        height: `${BUTTON_HEIGHT * ACTION_MENU_PAGE_SIZE}rem`,
      }}
    ></div>
  );
  if (
    !viewingCharacterSheet &&
    (hoveredItem ||
      (detailedItem &&
        currentMenu.type !== MenuStateType.CraftingActionSelection &&
        currentMenu.type !== MenuStateType.CombatActionSelected))
  ) {
    hoveredItemDisplay = (
      <div className="ml-3 h-0 w-0">
        <div
          className="fixed min-w-[50rem] max-w-[50rem]"
          style={{
            height: `${BUTTON_HEIGHT * ACTION_MENU_PAGE_SIZE}rem`,
          }}
        >
          <ItemDetailsWithComparison />
        </div>
      </div>
    );
  }

  const numberedButtonsOnThisPage = currentMenu.alwaysShowPageOne
    ? buttonProperties[ActionButtonCategory.Numbered].slice(0, ACTION_MENU_PAGE_SIZE)
    : buttonProperties[ActionButtonCategory.Numbered].slice(
        currentPageIndex * ACTION_MENU_PAGE_SIZE,
        currentPageIndex * ACTION_MENU_PAGE_SIZE + ACTION_MENU_PAGE_SIZE
      );

  const centerInfoDisplayOption = currentMenu.getCenterInfoDisplayOption
    ? currentMenu.getCenterInfoDisplayOption()
    : null;

  return (
    <section className={`flex flex-col justify-between `}>
      <CharacterFocusingButtons />
      <StackedMenuStateDisplay />
      <ul
        className={`flex list-none min-w-[25rem] max-w-[25rem] relative`}
        style={{ marginBottom: `${SPACING_REM_SMALL}rem` }}
      >
        {buttonProperties[ActionButtonCategory.Hidden].map((button, i) => (
          <div className="hidden" key={button.key}>
            <HotkeyButton hotkeys={button.dedicatedKeys} onClick={button.clickHandler}>
              <></>
            </HotkeyButton>
          </div>
        ))}
        {buttonProperties[ActionButtonCategory.Top].map((button, i) => {
          const conditionalStyles = (() => {
            if (buttonTitlesToAccent.includes(button.key)) return "bg-slate-800 border-white";
            return "border-slate-400 bg-slate-700";
          })();

          const thisButtonProperties = buttonProperties[ActionButtonCategory.Top][i]!;
          // in the old method we used a more unique key so different cancel buttons would
          // actually update, but cancel buttons tend to do the same thing anyway now
          return (
            <li key={thisButtonProperties.key} style={topButtonLiStyle}>
              <ActionMenuDedicatedButton
                extraStyles={`border mr-2 last:mr-0 h-10 ${conditionalStyles} `}
                properties={button}
              />
            </li>
          );
        })}
        {party.battleId !== null && currentMenu.type === MenuStateType.Base && (
          <HoverableTooltipWrapper
            extraStyles="ml-auto h-full w-fit border border-slate-400 bg-slate-700 pointer-events-auto flex justify-center items-center px-2"
            tooltipText="Action Points"
          >
            <span>
              AP: {focusedCharacter.combatantProperties.actionPoints}/{COMBATANT_MAX_ACTION_POINTS}
            </span>
          </HoverableTooltipWrapper>
        )}
        {actionMenuStore.operatingVendingMachine() && <VendingMachineShardDisplay />}
      </ul>
      <div
        className={`mb-3 flex`}
        style={{
          height: `${BUTTON_HEIGHT * ACTION_MENU_PAGE_SIZE}rem`,
        }}
      >
        <ul className="list-none relative min-w-[25rem] max-w-[25rem]">
          {numberedButtonsOnThisPage.map((button, i) => {
            const conditionalStyles =
              currentMenu.type === MenuStateType.ItemsOnGround
                ? "bg-slate-800 border-white"
                : "border-slate-400 bg-slate-700";

            return (
              <li
                key={button.key + i + currentPageIndex}
                tabIndex={button.shouldBeDisabled ? 0 : undefined} // so you can tab over to get the popups
                className={`
                    pointer-events-auto w-full  flex hover:bg-slate-950
                   `}
              >
                <NumberedButton
                  number={i + 1}
                  properties={button}
                  extraStyles={i == 0 ? `${conditionalStyles} border-t` : conditionalStyles}
                />
              </li>
            );
          })}
          {selectedActionDisplay}
          {detailedItemDisplay}
          {centerInfoDisplayOption || ""}
        </ul>
        {hoveredActionDisplay}
        {hoveredItemDisplay}
      </div>
      <div className="min-w-[25rem] max-w-[25rem]">
        <BottomButtons
          left={buttonProperties[ActionButtonCategory.Bottom][0]}
          right={buttonProperties[ActionButtonCategory.Bottom][1]}
        />
      </div>
    </section>
  );
});
