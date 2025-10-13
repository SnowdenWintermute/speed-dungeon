import { NextOrPrevious, getNextOrPreviousNumber } from "@speed-dungeon/common";
import { ReactNode } from "react";
import { MenuStateType } from "./menu-state-type";
import { ActionButtonCategory, ActionButtonsByCategory } from "./action-buttons-by-category";

export const ACTION_MENU_PAGE_SIZE = 6;

export abstract class ActionMenuState {
  protected pageIndex: number = 0;
  alwaysShowPageOne: boolean = false;
  constructor(
    public type: MenuStateType,
    protected minPageCount: number
  ) {}

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
    const newPage = getNextOrPreviousNumber(this.pageIndex, this.getPageCount(), direction);
    this.pageIndex = newPage;
  }

  goToLastPage() {
    this.pageIndex = this.getPageCount();
  }

  goToFirstPage() {
    this.pageIndex = 0;
  }

  getCenterInfoDisplayOption(): ReactNode | null {
    return null;
  }

  abstract getButtonProperties(): ActionButtonsByCategory;
}
