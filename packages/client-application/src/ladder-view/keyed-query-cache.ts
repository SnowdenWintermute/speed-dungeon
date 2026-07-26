import { makeAutoObservable, observable } from "mobx";
import { ERROR_MESSAGES, ReactiveNode } from "@speed-dungeon/common";
import { LadderQueryState, LadderQueryStatus } from "./query-state";

// one entry per distinct query. the key is the whole query — page, control scheme, mode and all —
// so a page is stored exactly as the server assembled it and never rebuilt from local records
export class KeyedQueryCache<TQuery, TResult> implements ReactiveNode {
  private stateByKey = new Map<string, LadderQueryState<TResult>>();
  private latestRequestIdByKey = new Map<string, number>();
  private nextRequestId = 0;

  constructor(
    private readonly fetchResult: (query: TQuery) => Promise<TResult>,
    private readonly keyOf: (query: TQuery) => string
  ) {}

  // pages are replaced wholesale and never mutated in place, so the map is reactive but its values
  // are stored as the server sent them rather than deep proxied. the two collaborators and the
  // in-flight bookkeeping are not view state
  makeObservable(): void {
    makeAutoObservable<
      KeyedQueryCache<TQuery, TResult>,
      "stateByKey" | "fetchResult" | "keyOf" | "latestRequestIdByKey" | "nextRequestId"
    >(this, {
      stateByKey: observable.shallow,
      fetchResult: false,
      keyOf: false,
      latestRequestIdByKey: false,
      nextRequestId: false,
    });
  }

  get(query: TQuery): LadderQueryState<TResult> | undefined {
    return this.stateByKey.get(this.keyOf(query));
  }

  // a full page load starts with an empty cache, so entering a url fetches without any special
  // casing. only navigating back to a query within the same session is served from memory.
  // a failed entry counts as asked: retrying is the refresh button's job, or a render loop would
  // hammer a server that is already failing
  request(query: TQuery): void {
    if (this.stateByKey.has(this.keyOf(query))) {
      return;
    }
    void this.fetch(query);
  }

  refresh(query: TQuery): void {
    void this.fetch(query);
  }

  clear(): void {
    this.stateByKey.clear();
    this.latestRequestIdByKey.clear();
  }

  private async fetch(query: TQuery): Promise<void> {
    const key = this.keyOf(query);
    const requestId = this.nextRequestId++;
    this.beginRequest(key, requestId);

    try {
      const result = await this.fetchResult(query);
      this.receiveResult(key, requestId, result);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : ERROR_MESSAGES.SERVER_GENERIC;
      this.receiveFailure(key, requestId, message);
    }
  }

  private beginRequest(key: string, requestId: number): void {
    this.latestRequestIdByKey.set(key, requestId);
    this.stateByKey.set(key, { type: LadderQueryStatus.Loading });
  }

  private receiveResult(key: string, requestId: number, result: TResult): void {
    if (this.isSuperseded(key, requestId)) {
      return;
    }
    this.stateByKey.set(key, {
      type: LadderQueryStatus.Loaded,
      result,
      lastUpdatedAt: Date.now(),
    });
  }

  private receiveFailure(key: string, requestId: number, message: string): void {
    if (this.isSuperseded(key, requestId)) {
      return;
    }
    this.stateByKey.set(key, { type: LadderQueryStatus.Failed, message });
  }

  // a refresh started while an earlier fetch for the same key was still in flight must win no
  // matter which of them the server answers first
  private isSuperseded(key: string, requestId: number): boolean {
    return this.latestRequestIdByKey.get(key) !== requestId;
  }
}
