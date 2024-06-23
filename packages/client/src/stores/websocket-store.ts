import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { produce } from "immer";
import { Socket } from "socket.io-client";
import { ClientToServerEventTypes, ServerToClientEventTypes } from "@speed-dungeon/common";

export type PartyClientSocket = Socket<ServerToClientEventTypes, ClientToServerEventTypes>;

type WebsocketState = {
  socketOption: undefined | Socket<ServerToClientEventTypes, ClientToServerEventTypes>;
  mainChannelName: string;
  usernamesInMainChannel: Set<string>;
  partySocketOption: undefined | PartyClientSocket;
  mutateState: (fn: (state: WebsocketState) => void) => void;
};

export const useWebsocketStore = create<WebsocketState>()(
  immer(
    devtools(
      (set, _get) => ({
        socketOption: undefined,
        usernamesInMainChannel: new Set(),
        mainChannelName: "",
        partySocketOption: undefined,
        mutateState: (fn: (state: WebsocketState) => void) => set(produce(fn)),
      }),
      { enabled: true, name: "websocket store" }
    )
  )
);
