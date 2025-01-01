import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { MutateState } from "./mutate-state";
import { produce } from "immer";
import { setAlert } from "@/app/components/alerts";

export class HttpRequestTracker {
  data: null | string | { [key: string]: any } = null;
  loading: boolean = true;
  statusCode: number = 0;
  errors: null | { message: string; field?: string }[] = null;
  ok: boolean = false;
}

export type HttpRequestState = {
  requests: { [url: string]: HttpRequestTracker };
  fetchData: (key: string, url: string, options: RequestInit) => Promise<void>;
  mutateState: MutateState<HttpRequestState>;
};

/** We are acting under the assumption that requests made with this store
will send responses that conform to our own custom error responses */
export const useHttpRequestStore = create<HttpRequestState>()(
  immer(
    devtools((set) => ({
      requests: {},
      fetchData: async (key: string, url: string, options: RequestInit) => {
        set((state) => ({
          requests: {
            ...state.requests,
            [key]: new HttpRequestTracker(),
          },
        }));

        const tracker = new HttpRequestTracker();
        // const fakeLatency = await new Promise((resolve) => {
        //   setTimeout(() => {
        //     resolve(true);
        //   }, 2000);
        // });
        const response = await fetch(url, options);
        tracker.ok = response.ok;
        tracker.loading = false;
        tracker.statusCode = response.status;
        let data: { [key: string]: any } = {};
        try {
          data = await response.json();
          if (data["errors"]) tracker.errors = data["errors"];
          else tracker.data = data;
        } catch {
          // no json in response
          console.error("No response from game server");
        }

        set((state) => ({
          requests: {
            ...state.requests,
            [key]: tracker,
          },
        }));
      },
      mutateState: (fn: (state: HttpRequestState) => void) => set(produce(fn)),
    }))
  )
);
