import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useClientApplication } from "@/hooks/create-client-application-context";
import {
  ACTION_MENU_CENTRAL_SECTION_HEIGHT,
  BUTTON_HEIGHT,
  SPACING_REM_SMALL,
} from "@/client-consts";
import { AbilityType, NextOrPrevious } from "@speed-dungeon/common";
import { CycleFocusedCharacterButtons } from "./CycleFocusedCharacterButtons";
import HoveredItemDisplay from "./HoveredItemDisplay";
import { CraftingItemDisplay } from "./CraftingItemDisplay";
import HoveredActionDisplay from "./HoveredActionDisplay";
import { StackedActionMenuScreenDisplay } from "./StackedMenuStateDisplay";
import {
  ActionMenuTopSectionItemType,
  ActionMenuNumberedButtonType,
  ActionMenuCentralSectionType,
  ActionMenuBottomSectionType,
  ActionMenuSidePanelSectionType,
} from "@speed-dungeon/client-application/src/action-menu/action-menu-display-data";
import GoBackButton from "./menu-state/common-buttons/GoBackButton";
import ToggleInventoryButton from "./menu-state/common-buttons/ToggleInventory";
import { ViewAbilityTreeButton } from "./menu-state/common-buttons/ViewAbilityTreeButton";
import { ViewItemsOnGroundButton } from "./menu-state/common-buttons/ViewItemsOnGroundButton";
import { ToggleAttributeAllocationMenuHiddenButton } from "./menu-state/common-buttons/ToggleAttributeAllocationMenuHiddenButton";
import { ToggleViewingEquipmentButton } from "./menu-state/common-buttons/ToggleViewingEquipmentButton";
import { OpenInventoryAsFreshStackButton } from "./menu-state/common-buttons/OpenInventoryAsFreshStackButton";
import { ExecuteCombatActionButton } from "./menu-state/common-buttons/ExecuteCombatActionButton";
import { CycleTargetingSchemesButtons } from "./menu-state/common-buttons/CycleTargetingSchemesButtons";
import { ConfirmShardConversionButton } from "./menu-state/common-buttons/ConfirmShardConversionButton";
import { UseItemButton } from "./menu-state/common-buttons/UseItemButton";
import { EquipToAltSlotButton } from "./menu-state/common-buttons/EquipToAltSlotButton";
import { DropItemButton } from "./menu-state/common-buttons/DropItemButton";
import { AllocateAbilityPointButton } from "./menu-state/common-buttons/AllocateAbilityPointButton";
import { VendingMachineShardDisplay } from "./VendingMachineShardDisplay";
import ActionMenuTopButton from "./menu-state/common-buttons/ActionMenuTopButton";
import { CombatActionButton } from "./menu-state/common-buttons/CombatActionButton";
import { ItemButton } from "./menu-state/common-buttons/ItemButton";
import { CraftActionButton } from "./menu-state/common-buttons/CraftActionButton";
import AbilityTreeAbilityButton from "./menu-state/common-buttons/AbilityTreeAbilityButton";
import { ActionMenuNumberedButton } from "./menu-state/common-buttons/ActionMenuNumberedButton";
import { PurchaseItemButton } from "./menu-state/common-buttons/PurchaseItemButton";
import { RepairEquipmentButton } from "./menu-state/common-buttons/RepairEquipmentButton";
import EmptyItemsList from "./menu-state/common-buttons/EmptyItemsList";
import { PageTurningButtons } from "./menu-state/common-buttons/PageTurningButtons";
import { CycleCombatActionTargetsButtons } from "./menu-state/common-buttons/CycleCombatActionTargetsButtons";
import { CycleConsideredAbilityInTreeColumnButtons } from "./menu-state/common-buttons/CycleConsideredAbilityInTreeColumnButtons";
import { ConsideringItemDisplay } from "./ConsideringItemDisplay";
import { ConfirmShardConversionDisplay } from "./ConfirmShardConversionDisplay";
import { ActionSelectedDetails } from "@/app/game/detailables/action-details/ActionSelectedDetails";
import AbilityDetailDisplay from "./AbilityDetailDisplay";
import TradeForBookConfirmationDisplay from "./TradeForBookConfirmationDisplay";
import TradeForBookRequirementsDisplay from "./TradeForBookRequirementsDisplay";
import { PriceDisplay } from "@/app/game/character-sheet/ShardsDisplay";

export const ActionMenu = observer(({ inputLocked }: { inputLocked: boolean }) => {
  const clientApplication = useClientApplication();
  const { actionMenu, detailableEntityFocus } = clientApplication;

  const currentMenu = actionMenu.getCurrentMenu();
  const topItems = currentMenu.getTopSection();
  const numberedButtons = currentMenu.getNumberedButtonsOnCurrentPage();
  const centralSection = currentMenu.getCentralSection();
  const bottomSection = currentMenu.getBottomSection();
  const sidePanelSection = currentMenu.getSidePanelSection();

  const viewingCharacterSheet = actionMenu.shouldShowCharacterSheet();
  const { hovered: hoveredAction } = detailableEntityFocus.combatantAbilities.get();
  const isHoveringAction = hoveredAction?.type === AbilityType.Action;
  const shouldShowHoveredItem = !viewingCharacterSheet && sidePanelSection === null;
  const shouldShowHoveredActionDisplay = isHoveringAction && !viewingCharacterSheet;

  useEffect(() => {
    if (numberedButtons.length === 0 && currentMenu.pageIndex > 0) {
      currentMenu.turnPage(NextOrPrevious.Previous);
    }
  }, [numberedButtons.length, currentMenu.pageIndex]);

  if (inputLocked) return <div />;

  return (
    <section className={`flex flex-col justify-between`}>
      <CycleFocusedCharacterButtons />
      <StackedActionMenuScreenDisplay />
      <div className="flex">
        <div className="flex flex-col">
          <div
            className={`flex list-none min-w-[25rem] max-w-[25rem] relative`}
            style={{ marginBottom: `${SPACING_REM_SMALL}rem` }}
          >
            <ul className="flex w-full">
              {topItems.map((item, i) => {
                switch (item.type) {
                  case ActionMenuTopSectionItemType.GoBack:
                    return <GoBackButton key={i} extraHotkeys={item.data.extraHotkeys} extraFn={item.data.extraFn} />;
                  case ActionMenuTopSectionItemType.ToggleInventory:
                    return <ToggleInventoryButton key={i} />;
                  case ActionMenuTopSectionItemType.ViewAbilityTree:
                    return <ViewAbilityTreeButton key={i} />;
                  case ActionMenuTopSectionItemType.ViewItemsOnGround:
                    return <ViewItemsOnGroundButton key={i} />;
                  case ActionMenuTopSectionItemType.ToggleAttributeAllocationMenuHidden:
                    return <ToggleAttributeAllocationMenuHiddenButton key={i} />;
                  case ActionMenuTopSectionItemType.ToggleViewEquipment:
                    return <ToggleViewingEquipmentButton key={i} />;
                  case ActionMenuTopSectionItemType.OpenInventoryAsFreshStack:
                    return <OpenInventoryAsFreshStackButton key={i} />;
                  case ActionMenuTopSectionItemType.ExecuteCombatAction:
                    return <ExecuteCombatActionButton key={i} />;
                  case ActionMenuTopSectionItemType.CycleTargetingSchemes:
                    return <CycleTargetingSchemesButtons key={i} />;
                  case ActionMenuTopSectionItemType.ConfirmShardConversion:
                    return <ConfirmShardConversionButton key={i} item={item.data.item} screenType={item.data.screenType} />;
                  case ActionMenuTopSectionItemType.UseItem:
                    return <UseItemButton key={i} item={item.data.item} />;
                  case ActionMenuTopSectionItemType.EquipToAltSlot:
                    return <EquipToAltSlotButton key={i} item={item.data.item} />;
                  case ActionMenuTopSectionItemType.DropItem:
                    return <DropItemButton key={i} item={item.data.item} />;
                  case ActionMenuTopSectionItemType.AllocateAbilityPoint:
                    return <AllocateAbilityPointButton key={i} ability={item.data.ability} />;
                  case ActionMenuTopSectionItemType.VendingMachineShards:
                    return <VendingMachineShardDisplay key={i} />;
                  case ActionMenuTopSectionItemType.TakeAllItemsFromGround:
                    return (
                      <ActionMenuTopButton
                        key={i}
                        hotkeys={item.data.hotkeys}
                        disabled={item.data.disabled}
                        handleClick={item.data.onClick}
                      >
                        Take All ({item.data.hotkeyString})
                      </ActionMenuTopButton>
                    );
                  case ActionMenuTopSectionItemType.ConfirmTradeForBook:
                    return (
                      <ActionMenuTopButton
                        key={i}
                        hotkeys={item.data.hotkeys}
                        disabled={item.data.disabled}
                        handleClick={item.data.onClick}
                      >
                        Confirm trade ({item.data.hotkeyString})
                      </ActionMenuTopButton>
                    );
                }
              })}
            </ul>
          </div>
          <div
            className={`mb-3 flex flex-col min-w-[25rem] max-w-[25rem] border-t border-slate-400`}
            style={{ height: `${ACTION_MENU_CENTRAL_SECTION_HEIGHT}rem` }}
          >
            {numberedButtons.map((btn, i) => {
              switch (btn.type) {
                case ActionMenuNumberedButtonType.CombatAction:
                  return (
                    <CombatActionButton
                      key={btn.data.actionName}
                      hotkeys={btn.data.hotkeys}
                      hotkeyLabel={btn.data.hotkeyLabel}
                      user={btn.data.user}
                      actionName={btn.data.actionName}
                    />
                  );
                case ActionMenuNumberedButtonType.Item:
                  return (
                    <ItemButton
                      key={btn.data.item.entityProperties.id}
                      item={btn.data.item}
                      text={btn.data.text}
                      disabled={btn.data.disabled}
                      hotkeyLabel={btn.data.hotkeyLabel}
                      hotkeys={btn.data.hotkeys}
                      clickHandler={btn.data.onClick}
                    >
                      {btn.data.showEquippedStatus && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex">
                          <div className="w-fit flex pr-2 pl-2 h-8 items-center bg-slate-700 border border-slate-400">
                            EQUIPPED
                          </div>
                          {btn.data.price !== undefined && (
                            <PriceDisplay price={btn.data.price} shardsOwned={null} />
                          )}
                        </div>
                      )}
                      {!btn.data.showEquippedStatus && btn.data.price !== undefined && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                          <PriceDisplay price={btn.data.price} shardsOwned={null} />
                        </div>
                      )}
                    </ItemButton>
                  );
                case ActionMenuNumberedButtonType.CraftAction:
                  return (
                    <CraftActionButton
                      key={btn.data.craftingAction}
                      equipment={btn.data.equipment}
                      craftingAction={btn.data.craftingAction}
                      listIndex={btn.data.listIndex}
                    />
                  );
                case ActionMenuNumberedButtonType.AbilityTreeAbility:
                  return (
                    <AbilityTreeAbilityButton
                      key={`${btn.data.rowIndex}-${btn.data.abilityOption ? "ability" : "empty"}`}
                      abilityOption={btn.data.abilityOption}
                      rowIndex={btn.data.rowIndex}
                      abilityTreeColumn={btn.data.abilityTreeColumn}
                    />
                  );
                case ActionMenuNumberedButtonType.AbilityTreeColumn:
                  return (
                    <ActionMenuNumberedButton
                      key={btn.data.columnNumber}
                      hotkeys={[`Digit${btn.data.columnNumber}`]}
                      hotkeyLabel={btn.data.columnNumber.toString()}
                      clickHandler={btn.data.onClick}
                    >
                      <div className="flex justify-between h-full w-full px-2">
                        <div className="flex items-center whitespace-nowrap overflow-hidden overflow-ellipsis flex-1">
                          Column {btn.data.columnNumber}
                        </div>
                      </div>
                    </ActionMenuNumberedButton>
                  );
                case ActionMenuNumberedButtonType.PurchaseConsumable:
                  return (
                    <PurchaseItemButton key={btn.data.listIndex} item={btn.data.item} listIndex={btn.data.listIndex} />
                  );
                case ActionMenuNumberedButtonType.RepairEquipment:
                  return (
                    <RepairEquipmentButton key={btn.data.listIndex} equipment={btn.data.equipment} listIndex={btn.data.listIndex} />
                  );
                case ActionMenuNumberedButtonType.VendingMachineOption:
                  return (
                    <ActionMenuNumberedButton
                      key={btn.data.title}
                      hotkeys={[`Digit${i + 1}`]}
                      hotkeyLabel={(i + 1).toString()}
                      clickHandler={btn.data.onClick}
                      disabled={btn.data.disabled}
                    >
                      <div className={`flex w-full items-center px-2 ${btn.data.disabled ? "opacity-50" : ""}`}>
                        {btn.data.title}
                      </div>
                    </ActionMenuNumberedButton>
                  );
                case ActionMenuNumberedButtonType.AssignAttributePoint:
                  return (
                    <ActionMenuNumberedButton
                      key={btn.data.attribute}
                      hotkeys={[`Digit${i + 1}`]}
                      hotkeyLabel={(i + 1).toString()}
                      disabled={btn.data.disabled}
                      clickHandler={btn.data.onClick}
                    >
                      <div className={`h-full flex items-center px-2 ${btn.data.disabled ? "opacity-50" : ""}`}>
                        {btn.data.label}
                      </div>
                    </ActionMenuNumberedButton>
                  );
              }
            })}
            {numberedButtons.length === 0 && centralSection === null && <EmptyItemsList />}
            {centralSection !== null && centralSection && (() => {
              switch (centralSection.type) {
                case ActionMenuCentralSectionType.ConsideringItem:
                  return <ConsideringItemDisplay />;
                case ActionMenuCentralSectionType.ConfirmShardConversion:
                  return <ConfirmShardConversionDisplay />;
                case ActionMenuCentralSectionType.CombatActionDetail:
                  return (
                    <div
                      className="border border-slate-400 bg-slate-700 min-w-[25rem] max-w-[25rem] p-2 flex"
                      style={{ height: `${ACTION_MENU_CENTRAL_SECTION_HEIGHT}rem` }}
                    >
                      <ActionSelectedDetails actionName={centralSection.data.actionName} />
                    </div>
                  );
                case ActionMenuCentralSectionType.AbilityDetail:
                  return <AbilityDetailDisplay ability={centralSection.data.ability} column={centralSection.data.column} />;
                case ActionMenuCentralSectionType.TradeForBookConfirmation:
                  return (
                    <TradeForBookConfirmationDisplay
                      item={centralSection.data.item}
                      bookType={centralSection.data.bookType}
                      onClick={centralSection.data.onClick}
                    />
                  );
                case ActionMenuCentralSectionType.TradeForBookRequirements:
                  return <TradeForBookRequirementsDisplay bookType={centralSection.data.bookType} />;
              }
            })()}
          </div>
          <div className="min-w-[25rem] max-w-[25rem]">
            {(() => {
              switch (bottomSection.type) {
                case ActionMenuBottomSectionType.PageTurning:
                  return <PageTurningButtons menuState={bottomSection.data.screen} />;
                case ActionMenuBottomSectionType.CycleCombatActionTargets:
                  return <CycleCombatActionTargetsButtons />;
                case ActionMenuBottomSectionType.CycleConsideredAbilityInTreeColumn:
                  return <CycleConsideredAbilityInTreeColumnButtons menuState={bottomSection.data.screen} />;
              }
            })()}
          </div>
        </div>
        <div style={{ paddingTop: `${SPACING_REM_SMALL + BUTTON_HEIGHT}rem` }}>
          {shouldShowHoveredItem && <HoveredItemDisplay />}
          {sidePanelSection?.type === ActionMenuSidePanelSectionType.CraftingItem && (
            <CraftingItemDisplay equipment={sidePanelSection.data.equipment} />
          )}
          {shouldShowHoveredActionDisplay && (
            <HoveredActionDisplay hoveredAction={hoveredAction.actionName} />
          )}
        </div>
      </div>
    </section>
  );
});
