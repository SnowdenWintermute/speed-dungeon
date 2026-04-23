import React from "react";
import Divider from "../components/atoms/Divider";
import CountDownDisplay from "../components/atoms/CountDownDisplay";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { observer } from "mobx-react-lite";

export const ReconnectionAwaitingReplayDisplay = observer(() => {
  const clientApplication = useClientApplication();
  const { replayResolutionTimeoutDuration } = clientApplication.uiStore;
  if (!replayResolutionTimeoutDuration) {
    return null;
  }

  return (
    <div className="absolute z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-slate-400 bg-slate-700 p-4">
      <h3 className="text-xl w-full text-center">Awaiting currently processing action replay</h3>
      <Divider />
      <p>
        You have reconnected during an action replay. You are currently seeing the end result of
        that replay, but other clients may be watching it play out and input will be locked on the
        server until it completes.
      </p>
      <div className="w-full flex justify-center">
        <CountDownDisplay durationMs={replayResolutionTimeoutDuration} className={"text-xl"} />
      </div>
    </div>
  );
});
