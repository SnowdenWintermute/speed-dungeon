import { invariant } from "@speed-dungeon/common";
import { makeAutoObservable } from "mobx";

export class HttpRequestTracker {
  constructor() {
    makeAutoObservable(this);
  }
  data: null | string | { [key: string]: any } = null;
  loading: boolean = true;
  statusCode: number = 0;
  errors: null | { message: string; field?: string }[] = null;
  ok: boolean = false;

  setStatusCode(newCode: number) {
    this.statusCode = newCode;
  }

  setLoading(newLoading: boolean) {
    this.loading = newLoading;
  }

  setOk(value: boolean) {
    this.ok = value;
  }
}

/** We are acting under the assumption that requests made with this store
will send responses that conform to our own custom error responses */
export class HttpRequestStore {
  constructor() {
    makeAutoObservable(this);
  }
  requests: { [url: string]: HttpRequestTracker } = {};

  clearRequestTracker(url: string) {
    delete this.requests[url];
  }

  async fetchData(key: string, url: string, options: RequestInit) {
    const tracker = new HttpRequestTracker();
    this.requests[key] = tracker;

    // const fakeLatency = await new Promise((resolve) => {
    //   setTimeout(() => {
    //     resolve(true);
    //   }, 2000);
    // });

    const response = await fetch(url, options);
    tracker.setOk(response.ok);
    tracker.setLoading(false);
    tracker.setStatusCode(response.status);
    let data: { [key: string]: any } = {};
    try {
      data = await response.json();
      if (data["errors"]) tracker.errors = data["errors"];
      else tracker.data = data;
    } catch {
      // no json in response
      console.error("No response from game server");
    }
  }

  async fetchAuthSession() {
    const getSessionRequestTrackerName = "get session";
    this.fetchData(
      getSessionRequestTrackerName,
      `${process.env.NEXT_PUBLIC_AUTH_SERVER_URL}/sessions`,
      {
        method: "GET",
        credentials: "include",
      }
    );
    const responseTracker = this.requests[getSessionRequestTrackerName];
    invariant(
      responseTracker !== undefined,
      "should have started a response tracker when fetching auth"
    );
    return responseTracker;
  }
}
