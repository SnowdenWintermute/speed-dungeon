import { NextOrPrevious, getNextOrPreviousNumber } from "@speed-dungeon/common";
import { ReactNode } from "react";
import { ACTION_MENU_PAGE_SIZE } from "..";
import { ActionMenuButtonProperties } from "./action-menu-button-properties";

export enum ActionButtonCategory {
  Top,
  Numbered,
  Bottom,
  Hidden,
}

export class ActionButtonsByCategory {
  [ActionButtonCategory.Top]: ActionMenuButtonProperties[] = [];
  [ActionButtonCategory.Numbered]: ActionMenuButtonProperties[] = [];
  [ActionButtonCategory.Bottom]: ActionMenuButtonProperties[] = [];
  [ActionButtonCategory.Hidden]: ActionMenuButtonProperties[] = [];

  constructor() {}
}

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
