"use client";
import React, { useEffect } from "react";
import { websocketConnection } from "@/singletons/websocket-connection";

export default function WebsocketManager() {
  useEffect(() => {
    console.log("all listeners set up");
    websocketConnection.connect();
    console.log("attempting connection");
    return () => {
      websocketConnection.disconnect();
    };
  }, []);

  return <div id="websocket-manager" />;
}
