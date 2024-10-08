import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { produce } from "immer";
import { MutateState } from "./mutate-state";

export type BroadcastChannelState = {
  messages: TabMessage[];
  channel: BroadcastChannel;
  mutateState: MutateState<BroadcastChannelState>;
};

export enum TabMessageType {
  ReconnectSocket,
}

export type TabMessage = {
  type: TabMessageType;
};

export const useBroadcastChannelStore = create<BroadcastChannelState>()(
  immer(
    devtools(
      (set, _get) => {
        const channel = new BroadcastChannel("channel_name");
        channel.onmessage = (message: any) => {
          set(
            produce((state: BroadcastChannelState) => {
              console.log("message got", message);
              state.messages.push(message.data);
            })
          );
        };

        return {
          messages: [],
          channel: channel,
          mutateState: (fn: (state: BroadcastChannelState) => void) => set(produce(fn)),
        };
      },
      { enabled: true, name: "broadcast channel store" }
    )
  )
);
