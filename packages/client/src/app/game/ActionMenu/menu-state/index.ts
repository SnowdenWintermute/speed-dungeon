import { NextOrPrevious, getNextOrPreviousNumber } from "@speed-dungeon/common";
import { ReactNode } from "react";
import { MENU_STATE_TYPE_STRINGS, MenuStateType } from "./menu-state-type";
import { ActionButtonCategory, ActionButtonsByCategory } from "./action-buttons-by-category";
import { action, computed, makeObservable, observable } from "mobx";

export const ACTION_MENU_PAGE_SIZE = 6;

export abstract class ActionMenuState {
  protected pageIndexInternal: number = 0;
  alwaysShowPageOne: boolean = false;
  private cachedPageCount: number;
  constructor(
    public type: MenuStateType,
    protected minPageCount: number
  ) {
    this.cachedPageCount = this.getPageCount();

    makeObservable(
      this,
      {
        pageIndexInternal: observable,
        pageIndex: computed,
        alwaysShowPageOne: observable,
        setPageIndex: action,
        turnPage: action,
        goToLastPage: action,
        goToFirstPage: action,
        buttonProperties: computed,
      },
      { autoBind: true }
    );
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

  get pageIndex() {
    return this.pageIndexInternal;
  }

  setPageIndex(newIndex: number) {
    this.pageIndexInternal = newIndex;
  }

  turnPage(direction: NextOrPrevious) {
    const newPage = getNextOrPreviousNumber(
      this.pageIndexInternal,
      this.cachedPageCount,
      direction
    );
    this.pageIndexInternal = newPage;
  }

  goToLastPage() {
    this.pageIndexInternal = this.cachedPageCount;
  }

  goToFirstPage() {
    this.pageIndexInternal = 0;
  }

  getCenterInfoDisplayOption(): ReactNode | null {
    return null;
  }

  abstract getButtonProperties(): ActionButtonsByCategory;

  get buttonProperties() {
    return this.getButtonProperties();
  }
}
