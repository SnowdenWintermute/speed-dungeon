"use client";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function GoogleOAuthLoader() {
  const searchParams = useSearchParams();
  const state = searchParams.get("state");
  const code = searchParams.get("code");
  const router = useRouter();

  const [loadingTextState, setLoadingStateText] = useState("Authenticating...");
  // don't run this effect twice in development using strict mode
  const effectRan = useRef(false);

  useEffect(() => {
    if (effectRan.current) return;
    effectRan.current = true;
    if (!code || !state)
      return setLoadingStateText("Error authenticating - missing query parameters");

    fetchToken(code, state, router);
  }, [code, state]);

  return <div>{loadingTextState}</div>;
}

async function fetchToken(code: string, state: string, router: AppRouterInstance) {
  try {
    const response = await fetch("http://localhost:8081/oauth/google", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        // "Access-Control-Allow-Origin": "http://localhost:8081",
      },
      credentials: "include",
      body: JSON.stringify({ code, state }),
    });

    const data = await response.json();
    console.log(data);
    router.push("/");
  } catch (err) {
    console.log(err);

    // Handle errors
  }
}
