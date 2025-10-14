import { NextOrPrevious, getNextOrPreviousNumber } from "@speed-dungeon/common";
import { ReactNode } from "react";
import { MENU_STATE_TYPE_STRINGS, MenuStateType } from "./menu-state-type";
import { ActionButtonCategory, ActionButtonsByCategory } from "./action-buttons-by-category";

export const ACTION_MENU_PAGE_SIZE = 6;

export abstract class ActionMenuState {
  protected pageIndex: number = 0;
  alwaysShowPageOne: boolean = false;
  private cachedPageCount: number;
  constructor(
    public type: MenuStateType,
    protected minPageCount: number
  ) {
    this.cachedPageCount = this.getPageCount();

    // makeAutoObservable(this, {}, { autoBind: true });
  }

  getStringName() {
    return MENU_STATE_TYPE_STRINGS[this.type];
  }

  getPageCount() {
    const buttonProperties = this.getButtonProperties();
    return Math.max(
      this.minPageCount,
      Math.ceil(buttonProperties[ActionButtonCategory.Numbered].length / ACTION_MENU_PAGE_SIZE)
    );
  }

  getPageIndex() {
    return this.pageIndex;
  }

  setPageIndex(newIndex: number) {
    this.pageIndex = newIndex;
  }

  turnPage(direction: NextOrPrevious) {
    const newPage = getNextOrPreviousNumber(this.pageIndex, this.cachedPageCount, direction);
    this.pageIndex = newPage;
  }

  goToLastPage() {
    this.pageIndex = this.cachedPageCount;
  }

  goToFirstPage() {
    this.pageIndex = 0;
  }

  getCenterInfoDisplayOption(): ReactNode | null {
    return null;
  }

  abstract getButtonProperties(): ActionButtonsByCategory;
}
