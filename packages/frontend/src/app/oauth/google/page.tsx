"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BroadcastChannelMananger, TabMessageType } from "@/client-application/broadcast-channel";

export default function GoogleOAuthLoader() {
  const searchParams = useSearchParams();
  const state = searchParams.get("state");
  const authorizationCode = searchParams.get("code");
  const broadcastChannel = new BroadcastChannel(BroadcastChannelMananger.CHANNEL_NAME);

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

      broadcastChannel.postMessage({ type: TabMessageType.ReconnectSocket });
      broadcastChannel.postMessage({ type: TabMessageType.RefetchAuthSession });

      window.close();
    })();
  }, [authorizationCode, state, broadcastChannel]);

  return <div className="w-full flex justify-center p-4">{loadingTextState}</div>;
}

async function fetchToken(code: string, state: string) {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_AUTH_SERVER_URL}/oauth/google`, {
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
