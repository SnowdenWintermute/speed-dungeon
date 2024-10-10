const channelName = "speed dungeon broadcast channel";
export const broadcastChannel = new BroadcastChannel(channelName);

export enum TabMessageType {
  ReconnectSocket,
}

export type TabMessage = {
  type: TabMessageType;
};

broadcastChannel.onmessage = (message: any) => {
  console.log("got bc message in module level variable");
  console.log(message);
  if (message.data.type === TabMessageType.ReconnectSocket) {
    console.log("resetting connection");
  }
};
