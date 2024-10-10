"use client";
import { TabMessageType, useBroadcastChannelStore } from "@/stores/broadcast-channel-store";
import { useWebsocketStore } from "@/stores/websocket-store";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { enableMapSet } from "immer";
import { useHttpRequestStore } from "@/stores/http-request-store";
enableMapSet();

export default function GoogleOAuthLoader() {
  const searchParams = useSearchParams();
  const state = searchParams.get("state");
  const authorizationCode = searchParams.get("code");
  const resetSocketConnection = useWebsocketStore().resetConnection;
  const mutateBroadcastState = useBroadcastChannelStore().mutateState;
  const fetchData = useHttpRequestStore().fetchData;
  const httpRequestTrackerName = "get session";

  const [loadingTextState, setLoadingStateText] = useState("Authenticating...");
  // don't run this effect twice in development using strict mode
  const effectRan = useRef(false);

  useEffect(() => {
    if (effectRan.current) return;
    effectRan.current = true;
    if (!authorizationCode || !state)
      return setLoadingStateText("Error authenticating - missing query parameters");
    (async () => {
      await fetchToken(authorizationCode, state);

      resetSocketConnection();
      mutateBroadcastState((state) => {
        // message to have their other tabs reconnect with new cookie
        // to keep socket connections consistent with current authorization
        state.channel.postMessage({ type: TabMessageType.ReconnectSocket });
      });

      fetchData(httpRequestTrackerName, `${process.env.NEXT_PUBLIC_AUTH_SERVER_URL}/sessions`, {
        method: "GET",
        credentials: "include",
      });

      window.close();
    })();
  }, [authorizationCode, state]);

  return <div className="w-full flex justify-center p-4">{loadingTextState}</div>;
}

async function fetchToken(code: string, state: string) {
  try {
    await fetch("http://localhost:8081/oauth/google", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        // "Access-Control-Allow-Origin": "http://localhost:8081",
      },
      credentials: "include",
      body: JSON.stringify({ code, state }),
    });
  } catch (err) {
    console.error(err);
  }
}
