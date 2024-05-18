import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { produce } from "immer";
import { Alert } from "@/app/components/alerts";

export type AlertState = {
  alerts: Alert[];
  lastAlertId: number;
  mutateState: (fn: (state: AlertState) => void) => void;
};

export const useAlertStore = create<AlertState>()(
  immer(
    devtools(
      (set, _get) => ({
        alerts: [],
        lastAlertId: 0,
        mutateState: (fn: (state: AlertState) => void) => set(produce(fn)),
      }),
      { enabled: true, name: "alert store" }
    )
  )
);
