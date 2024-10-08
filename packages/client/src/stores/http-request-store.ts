import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export class HttpRequestTracker {
  data: null | string | { [key: string]: any } = null;
  loading: boolean = true;
  statusCode: number = 0;
  errors: null | { message: string; field?: string }[] = null;
}

export type HttpRequestState = {
  requests: { [url: string]: HttpRequestTracker };
  fetchData: (key: string, url: string, options: RequestInit) => Promise<void>;
  clearRequest: (key: string) => void;
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
        console.log("fetching with options: ", options);
        const response = await fetch(url, options);
        tracker.loading = false;
        tracker.statusCode = response.status;
        let data: { [key: string]: any } = {};
        try {
          data = await response.json();
          if (data["errors"]) tracker.errors = data["errors"];
          else tracker.data = data;
        } catch {
          // no json in response
        }
        console.log("data: ", data);

        set((state) => ({
          requests: {
            ...state.requests,
            [key]: tracker,
          },
        }));
      },
      clearRequest: (key: string) => {
        set((state) => {
          const newRequests = { ...state.requests };
          delete newRequests[key];
          return { requests: newRequests };
        });
      },
    }))
  )
);
