import { makeAutoObservable } from "mobx";
import isEqual from "lodash/isEqual";
import {
  ClientIntentType,
  DateRange,
  ReactiveNode,
  USER_GAME_HISTORY_PAGE_SIZE,
  UserGameHistoryEntry,
} from "@speed-dungeon/common";
import { ClientApplication } from ".";
import { ClientSingleton } from "./clients/singleton";
import { LobbyClient } from "./clients/lobby";

export class LadderRecordsStore implements ReactiveNode {
  currentPage = 0;
  totalRecordsCount: number | undefined = undefined;
  _lobbyClientRef: ClientSingleton<LobbyClient>;
  private dateRange: DateRange | undefined = undefined;
  private pages = new Map<number, UserGameHistoryEntry[]>();
  private pagesInFlight = new Set<number>();

  constructor(clientApplication: ClientApplication) {
    this._lobbyClientRef = clientApplication.lobbyClientRef;
  }

  makeObservable(): void {
    makeAutoObservable(this, { _lobbyClientRef: false });
  }

  getPage(page: number): UserGameHistoryEntry[] | undefined {
    return this.pages.get(page);
  }

  get currentPageEntries(): UserGameHistoryEntry[] | undefined {
    return this.pages.get(this.currentPage);
  }

  get totalPageCount(): number | undefined {
    if (this.totalRecordsCount === undefined) {
      return undefined;
    }
    return Math.ceil(this.totalRecordsCount / USER_GAME_HISTORY_PAGE_SIZE);
  }

  getDateRange(): DateRange | undefined {
    return this.dateRange;
  }

  setPage(page: number, entries: UserGameHistoryEntry[]): void {
    this.pages.set(page, entries);
    this.pagesInFlight.delete(page);
  }

  setTotalRecordsCount(count: number): void {
    this.totalRecordsCount = count;
  }

  invalidate(): void {
    this.pages.clear();
    this.pagesInFlight.clear();
    this.totalRecordsCount = undefined;
  }

  refresh(): void {
    this.invalidate();
    this.requestRecordsCount();
    this.goToPage(0);
  }

  setDateRange(dateRange: DateRange | undefined): void {
    if (isEqual(dateRange, this.dateRange)) {
      return;
    }
    this.dateRange = dateRange;
    this.refresh();
  }

  goToPage(page: number): void {
    this.currentPage = page;
    const alreadyHaveOrFetching = this.pages.has(page) || this.pagesInFlight.has(page);
    if (alreadyHaveOrFetching) {
      return;
    }
    this.pagesInFlight.add(page);
    this._lobbyClientRef.get().dispatchIntent({
      type: ClientIntentType.GetUserGameHistory,
      data: { page, dateRange: this.dateRange },
    });
  }

  requestRecordsCount(): void {
    this._lobbyClientRef.get().dispatchIntent({
      type: ClientIntentType.GetUserGameRecordsCount,
      data: { dateRange: this.dateRange },
    });
  }
}
