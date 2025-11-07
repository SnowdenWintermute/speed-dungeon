import {
  Consumable,
  Item,
  ItemUtils,
  NextOrPrevious,
  getNextOrPreviousNumber,
  getSkillBookName,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import PageTurningButtons from "./common-buttons/PageTurningButtons";
import { ReactNode } from "react";
import { MENU_STATE_TYPE_STRINGS, MenuStateType } from "./menu-state-type";
import React from "react";
import { ItemButton } from "./common-buttons/ItemButton";

export const ACTION_MENU_PAGE_SIZE = 6;

export abstract class ActionMenuState {
  pageIndexInternal: number = 0;
  alwaysShowPageOne: boolean = false;
  protected numberedButtons: ReactNode[] = [];
  protected centralSection: ReactNode = "";
  private pageCount: number = 1;
  protected minPageCount: number = 1;
  constructor(public type: MenuStateType) {}

  // getInvisibleButtons(): ReactNode {}
  abstract getTopSection(): ReactNode;
  getNumberedButtons(): ReactNode[] {
    const startIndex = ACTION_MENU_PAGE_SIZE * this.pageIndex;
    const endIndex = startIndex + ACTION_MENU_PAGE_SIZE;
    return this.numberedButtons.slice(startIndex, endIndex);
  }
  abstract recalculateButtons(): void;
  getCentralSection(): ReactNode {
    return this.centralSection;
  }
  getBottomSection(): ReactNode {
    return <PageTurningButtons menuState={this} />;
  }
  // abstract getSideContent: ReactNode
  // abstract cachedNumberedButtons: number

  getStringName() {
    return MENU_STATE_TYPE_STRINGS[this.type];
  }

  setPageCount(newCount: number) {
    this.pageCount = newCount;
  }

  recalulatePageCount() {
    this.setPageCount(Math.ceil(this.numberedButtons.length / ACTION_MENU_PAGE_SIZE));
  }

  get pageIndex() {
    return this.pageIndexInternal;
  }

  getPageCount() {
    return this.pageCount;
  }

  setPageIndex(newIndex: number) {
    this.pageIndexInternal = newIndex;
  }

  turnPage(direction: NextOrPrevious) {
    const newPage = getNextOrPreviousNumber(this.pageIndexInternal, this.pageCount - 1, direction, {
      minNumber: 0,
    });
    this.pageIndexInternal = newPage;
  }

  goToLastPage() {
    this.pageIndexInternal = this.pageCount - 1;
  }

  goToFirstPage() {
    this.pageIndexInternal = 0;
  }

  getCenterInfoDisplayOption(): ReactNode | null {
    return null;
  }

  static getItemButtonsFromList(items: Item[], clickHandler: (item: Item) => void) {
    const stackedItems = ItemUtils.sortIntoStacks(items);

    const { equipmentAndShardStacks, consumablesByTypeAndLevel } = stackedItems;

    const itemsToMakeButtonsFor: Item[] = [];

    for (const [consumableType, consumableStacksByLevel] of iterateNumericEnumKeyedRecord(
      consumablesByTypeAndLevel
    )) {
      for (const [itemLevelString, consumableStack] of Object.entries(consumableStacksByLevel)) {
        const firstConsumableOfThisType = consumableStack[0];
        if (!firstConsumableOfThisType) continue;
        itemsToMakeButtonsFor.push(firstConsumableOfThisType);
      }
    }

    itemsToMakeButtonsFor.push(...equipmentAndShardStacks);

    return itemsToMakeButtonsFor.map((item, i) => {
      const itemLevel = item.itemLevel;
      let buttonText = item.entityProperties.name;
      if (item instanceof Consumable) {
        const { consumableType } = item;
        const skillBookNameOption = getSkillBookName(consumableType, itemLevel);
        if (skillBookNameOption) buttonText = skillBookNameOption;
        const stackOption = consumablesByTypeAndLevel[consumableType]?.[itemLevel];
        const stackSize = stackOption?.length || 0;
        if (stackSize > 1) buttonText += ` (${stackSize})`;
      }

      const buttonNumber = (i % ACTION_MENU_PAGE_SIZE) + 1;
      return (
        <ItemButton
          key={item.entityProperties.id}
          item={item}
          text={buttonText}
          hotkeyLabel={buttonNumber.toString()}
          hotkeys={[`Digit${buttonNumber}`]}
          clickHandler={clickHandler}
        />
      );
    });
  }
}
