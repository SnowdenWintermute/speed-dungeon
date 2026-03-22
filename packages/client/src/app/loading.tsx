import React from "react";
import LoadingSpinner from "./components/atoms/LoadingSpinner";
import { ArrayUtils } from "@speed-dungeon/common";
import { observer } from "mobx-react-lite";
import { useClientApplication } from "@/hooks/create-client-application-context";

export const Loading = observer(() => {
  const loadingMessages = [
    "Travelling to a new area",
    "Descending deeper",
    "Approaching destination",
    "Refilling autoinjectors",
    "Collating affixes",
    "Researching loot tables",
  ];
  const { randomNumberGenerator } = useClientApplication();
  let loadingMessage = ArrayUtils.chooseRandom(loadingMessages, randomNumberGenerator);
  if (loadingMessage instanceof Error) loadingMessage = "Loading";
  return (
    <main className="h-screen w-screen pt-10 flex flex-col items-center">
      <h1 className="mb-4">{loadingMessage}...</h1>
      <div className="h-10 w-10">
        <LoadingSpinner />
      </div>
    </main>
  );
});
