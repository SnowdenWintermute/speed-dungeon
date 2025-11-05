import { NextOrPrevious, getNextOrPreviousNumber } from "@speed-dungeon/common";
import { ReactNode } from "react";
import { MENU_STATE_TYPE_STRINGS, MenuStateType } from "./menu-state-type";
import { ActionButtonCategory, ActionButtonsByCategory } from "./action-buttons-by-category";
import { action, computed, makeObservable, observable } from "mobx";

export const ACTION_MENU_PAGE_SIZE = 6;

export abstract class ActionMenuState {
  pageIndexInternal: number = 0;
  alwaysShowPageOne: boolean = false;
  private cachedPageCount: number = 1;
  constructor(
    public type: MenuStateType,
    protected minPageCount: number
  ) {
    // can't use makeAutoObservable on classes with subclassing
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
        pageCount: computed,
        setCachedPageCount: action,
      },
      { autoBind: true }
    );
  }

  getStringName() {
    return MENU_STATE_TYPE_STRINGS[this.type];
  }

  setCachedPageCount(newCount: number) {
    this.cachedPageCount = newCount;
  }

  getPageCount() {
    if (this.cachedPageCount === null) {
      const buttonProperties = this.getButtonProperties();
      const numberedButtonsCount = buttonProperties[ActionButtonCategory.Numbered].length;
      const pageCount = Math.ceil(numberedButtonsCount / ACTION_MENU_PAGE_SIZE);

      const newCount = Math.max(this.minPageCount, pageCount);
      this.setCachedPageCount(newCount);
    }

    return this.cachedPageCount;
  }

  get pageIndex() {
    return this.pageIndexInternal;
  }

  get pageCount() {
    return this.cachedPageCount;
  }

  setPageIndex(newIndex: number) {
    this.pageIndexInternal = newIndex;
  }

  turnPage(direction: NextOrPrevious) {
    const newPage = getNextOrPreviousNumber(
      this.pageIndexInternal,
      this.cachedPageCount - 1,
      direction,
      { minNumber: 0 }
    );
    this.pageIndexInternal = newPage;
  }

  goToLastPage() {
    this.pageIndexInternal = this.cachedPageCount - 1;
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
