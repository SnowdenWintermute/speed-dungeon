import { NextOrPrevious, getNextOrPreviousNumber } from "@speed-dungeon/common";
import PageTurningButtons from "./common-buttons/PageTurningButtons";
import { ReactNode } from "react";
import { MENU_STATE_TYPE_STRINGS, MenuStateType } from "./menu-state-type";
import { action, computed, makeObservable, observable } from "mobx";
import React from "react";

export const ACTION_MENU_PAGE_SIZE = 6;

export abstract class ActionMenuState {
  pageIndexInternal: number = 0;
  alwaysShowPageOne: boolean = false;
  protected numberedButtons: ReactNode[] = [];
  private pageCount: number = 1;
  protected minPageCount: number = 1;
  constructor(public type: MenuStateType) {
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
        getPageCount: observable,
      },
      { autoBind: true }
    );
  }

  // getInvisibleButtons(): ReactNode {
  //   //
  // }
  abstract getTopSection(): ReactNode;
  getNumberedButtons(): ReactNode[] {
    const startIndex = ACTION_MENU_PAGE_SIZE * this.pageIndex;
    const endIndex = startIndex + ACTION_MENU_PAGE_SIZE;
    return this.numberedButtons.slice(startIndex, endIndex);
  }
  abstract recalculateButtons(): void;
  // abstract getCentralSection: ReactNode
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
}
