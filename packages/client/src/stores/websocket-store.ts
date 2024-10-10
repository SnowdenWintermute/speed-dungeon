import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { produce } from "immer";
import { Socket } from "socket.io-client";
import {
  ClientToServerEventTypes,
  ServerToClientEventTypes,
  UserChannelDisplayData,
} from "@speed-dungeon/common";

export type PartyClientSocket = Socket<ServerToClientEventTypes, ClientToServerEventTypes>;

type WebsocketState = {
  mainChannelName: string;
  usersInMainChannel: { [username: string]: UserChannelDisplayData };
  mutateState: (fn: (state: WebsocketState) => void) => void;
};

export const useWebsocketStore = create<WebsocketState>()(
  immer(
    devtools(
      (set, _get) => {
        return {
          usersInMainChannel: {},
          mainChannelName: "",
          mutateState: (fn: (state: WebsocketState) => void) => set(produce(fn)),
        };
      },
      { enabled: true, name: "websocket store" }
    )
  )
);
