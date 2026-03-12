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
import { ReactNode } from "react";
import { ActionMenuScreenType } from "../screen-types";
import { ACTION_MENU_PAGE_SIZE } from "@/client-consts";
import EmptyItemsList from "@/app/game/ActionMenu/menu-state/common-buttons/EmptyItemsList";
import { PageTurningButtons } from "@/app/game/ActionMenu/menu-state/common-buttons/PageTurningButtons";
import { MENU_STATE_TYPE_STRINGS } from "@/app/game/ActionMenu/menu-state/menu-state-type";
import { ItemButton } from "@/app/game/ActionMenu/menu-state/common-buttons/ItemButton";
import { ClientApplication } from "@/client-application";

export abstract class ActionMenuScreen {
  pageIndexInternal: number = 0;
  alwaysShowPageOne: boolean = false;
  private pageCount: number = 1;
  protected minPageCount: number = 1;
  constructor(
    protected clientApplication: ClientApplication,
    public type: ActionMenuScreenType
  ) {}

  // getInvisibleButtons(): ReactNode {}
  abstract getTopSection(): ReactNode;

  getNumberedButtons(): ReactNode[] {
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

  getCentralSection(): ReactNode {
    if (this.getNumberedButtons().length === 0) {
      return <EmptyItemsList />;
    } else {
      return "";
    }
  }

  getBottomSection(): ReactNode {
    return <PageTurningButtons menuState={this} />;
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
    customChildrenGetter?: (item: Item) => ReactNode
  ) {
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
      return (
        <ItemButton
          key={item.entityProperties.id}
          item={item}
          text={buttonText}
          disabled={itemDisabledFunction(item)}
          hotkeyLabel={buttonNumber.toString()}
          hotkeys={[`Digit${buttonNumber}`]}
          clickHandler={clickHandler}
        >
          {customChildrenGetter?.(item)}
        </ItemButton>
      );
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
