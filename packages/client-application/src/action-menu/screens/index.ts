import {
  CombatantContext,
  Consumable,
  EntityName,
  Item,
  ItemUtils,
  NextOrPrevious,
  getNextOrPreviousNumber,
  getSkillBookName,
  iterateNumericEnumKeyedRecord,
} from "@speed-dungeon/common";
import { ActionMenuScreenType, MENU_STATE_TYPE_STRINGS } from "../screen-types";
import { ACTION_MENU_PAGE_SIZE } from "../consts";
import {
  ActionMenuBottomSection,
  ActionMenuBottomSectionType,
  ActionMenuCentralSection,
  ActionMenuNumberedButtonDescriptor,
  ActionMenuNumberedButtonType,
  ActionMenuSidePanelSection,
  ActionMenuTopSectionItem,
} from "../action-menu-display-data";
import { ClientApplication } from "../../";

export abstract class ActionMenuScreen {
  pageIndexInternal: number = 0;
  alwaysShowPageOne: boolean = false;
  private pageCount: number = 1;
  protected minPageCount: number = 1;
  constructor(
    protected clientApplication: ClientApplication,
    public type: ActionMenuScreenType
  ) {}

  abstract getTopSection(): ActionMenuTopSectionItem[];

  getNumberedButtons(): ActionMenuNumberedButtonDescriptor[] {
    return [];
  }

  get numberedButtons() {
    return this.getNumberedButtons();
  }

  getNumberedButtonsOnCurrentPage() {
    const startIndex = ACTION_MENU_PAGE_SIZE * this.pageIndexInternal;
    const endIndex = startIndex + ACTION_MENU_PAGE_SIZE;
    return this.numberedButtons.slice(startIndex, endIndex);
  }

  getCentralSection(): ActionMenuCentralSection | null {
    return null;
  }

  getBottomSection(): ActionMenuBottomSection {
    return { type: ActionMenuBottomSectionType.PageTurning, data: { screen: this } };
  }

  getSidePanelSection(): ActionMenuSidePanelSection | null {
    return null;
  }

  getStringName() {
    return MENU_STATE_TYPE_STRINGS[this.type];
  }

  get pageIndex() {
    return this.pageIndexInternal;
  }

  getPageCount() {
    return Math.ceil(this.numberedButtons.length / ACTION_MENU_PAGE_SIZE);
  }

  setPageIndex(newIndex: number) {
    this.pageIndexInternal = newIndex;
  }

  turnPage(direction: NextOrPrevious) {
    const newPage = getNextOrPreviousNumber(
      this.pageIndexInternal,
      this.getPageCount() - 1,
      direction,
      {
        minNumber: 0,
      }
    );
    this.pageIndexInternal = newPage;
  }

  goToLastPage() {
    this.pageIndexInternal = this.pageCount - 1;
  }

  goToFirstPage() {
    this.pageIndexInternal = 0;
  }

  static getItemButtonsFromList(
    items: Item[],
    clickHandler: (item: Item) => void,
    itemDisabledFunction: (item: Item) => boolean,
    options?: {
      getShowEquippedStatus?: (item: Item) => boolean;
      getPrice?: (item: Item) => number | null;
    }
  ): ActionMenuNumberedButtonDescriptor[] {
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
        if (stackSize > 1) buttonText = (buttonText + ` (${stackSize})`) as EntityName;
      }

      const buttonNumber = (i % ACTION_MENU_PAGE_SIZE) + 1;
      return {
        type: ActionMenuNumberedButtonType.Item as const,
        data: {
          item,
          text: buttonText,
          disabled: itemDisabledFunction(item),
          hotkeys: [`Digit${buttonNumber}`],
          hotkeyLabel: buttonNumber.toString(),
          onClick: clickHandler,
          showEquippedStatus: options?.getShowEquippedStatus?.(item),
          price: options?.getPrice?.(item),
        },
      };
    });
  }

  static disableButtonBecauseNotThisCombatantTurn(
    combatantId: string,
    characterContext: CombatantContext
  ) {
    const { party, game } = characterContext;
    const battleOption = party.getBattleOption(game);
    let disableButtonBecauseNotThisCombatantTurn = false;

    if (battleOption) {
      disableButtonBecauseNotThisCombatantTurn =
        !battleOption.turnOrderManager.combatantIsFirstInTurnOrder(combatantId);
    }

    return disableButtonBecauseNotThisCombatantTurn;
  }
}
