import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { produce } from "immer";
import { Socket } from "socket.io-client";

type WebsocketState = {
  socketOption: undefined | Socket;
  mutateState: (fn: (state: WebsocketState) => void) => void;
};

export const useWebsocketStore = create<WebsocketState>()(
  immer(
    devtools(
      (set, _get) => ({
        socketOption: undefined,
        mutateState: (fn: (state: WebsocketState) => void) => set(produce(fn)),
      }),
      { enabled: true, name: "websocket store" }
    )
  )
);
