import { useWebsocketStore } from "@/stores/websocket-store";
import React, { useEffect } from "react";
import { io } from "socket.io-client";

// const socketAddress = process.env.NODE_ENV === "production" ? SOCKET_ADDRESS_PRODUCTION : process.env.NEXT_PUBLIC_SOCKET_API;
const socketAddress = "http://localhost:8080";

function SocketManager() {
  const mutateWebsocketStore = useWebsocketStore().mutateState;
  const socket = useWebsocketStore().socket;

  // setup socket
  useEffect(() => {
    mutateWebsocketStore(
      (state) =>
        (state.socket = io(socketAddress || "", { transports: ["websocket"] }))
    );
    console.log("socket address: ", socketAddress);
    return () => {
      if (socket) socket.disconnect();
    };
  }, [mutateWebsocketStore, socket]);

  return <div aria-hidden="true"></div>;
}

export default SocketManager;
