import React, { useEffect, useState } from "react";
import Divider from "../components/atoms/Divider";
import CountDownDisplay from "../components/atoms/CountDownDisplay";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { observer } from "mobx-react-lite";
import { RECONNECTION_OPPORTUNITY_TIMEOUT_MS } from "@speed-dungeon/common";

export const AwaitingPlayersReconnectingDisplay = observer(() => {
  const clientApplication = useClientApplication();
  const { playerUsernamesAwaitingReconnection } = clientApplication.gameContext.requireParty();

  const [resetCount, setResetCount] = useState(0);

  useEffect(() => {
    setResetCount(resetCount + 1);
  }, [playerUsernamesAwaitingReconnection]);

  if (!playerUsernamesAwaitingReconnection.size) {
    return null;
  }

  return (
    <div className="absolute z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-slate-400 bg-slate-700 p-4">
      <h3 className="text-xl w-full text-center">Waiting for players to reconnect</h3>
      <Divider />
      <ul>
        {[...playerUsernamesAwaitingReconnection].map((username) => (
          <li key={username}>{username}</li>
        ))}
      </ul>
      <div className="w-full flex justify-center">
        <CountDownDisplay durationMs={RECONNECTION_OPPORTUNITY_TIMEOUT_MS} className={"text-xl"} />
      </div>
    </div>
  );
});
