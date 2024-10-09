import ButtonBasic from "@/app/components/atoms/ButtonBasic";
import LoadingSpinner from "@/app/components/atoms/LoadingSpinner";
import { useGameStore } from "@/stores/game-store";
import { useHttpRequestStore } from "@/stores/http-request-store";
import { useLobbyStore } from "@/stores/lobby-store";
import React, { useEffect } from "react";

export default function UserMenuContainer() {
  const username = useGameStore().username;
  const fetchData = useHttpRequestStore().fetchData;
  const getSessionRequestTrackerName = "get session";
  const responseTracker = useHttpRequestStore().requests[getSessionRequestTrackerName];
  const mutateLobbyState = useLobbyStore().mutateState;
  const showAuthForm = useLobbyStore().showAuthForm;

  useEffect(() => {
    // check for logged in
    // - when mount component
    // - when login flow complete
    // - when logout pressed
    fetchData(getSessionRequestTrackerName, `${process.env.NEXT_PUBLIC_AUTH_SERVER_URL}/sessions`, {
      method: "GET",
      credentials: "include",
    });
  }, [username]);

  const firstLetterOfUsername = username ? username.charAt(0) : "";
  return !responseTracker || responseTracker?.loading ? (
    <div className="h-10 w-10">
      <LoadingSpinner />
    </div>
  ) : responseTracker?.statusCode === 200 ? (
    <button className="border border-slate-400 rounded-full h-10 w-10 flex justify-center items-center">
      <span className="text-lg font-bold">{firstLetterOfUsername.toUpperCase()}</span>
    </button>
  ) : (
    <ButtonBasic
      onClick={() => {
        if (showAuthForm) {
          mutateLobbyState((state) => {
            state.highlightAuthForm = true;
          });
          setTimeout(() => {
            mutateLobbyState((state) => {
              state.highlightAuthForm = false;
            });
          }, 300);
        } else {
          mutateLobbyState((state) => {
            state.showAuthForm = true;
          });
        }
      }}
    >
      LOG IN
    </ButtonBasic>
  );
}
