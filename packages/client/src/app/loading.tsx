import React from "react";
import LoadingSpinner from "./components/atoms/LoadingSpinner";
import { chooseRandomFromArray } from "@speed-dungeon/common";
import { clientRngSingleton } from "@/singletons/random-number-generator";

export default function Loading() {
  const loadingMessages = [
    "Travelling to a new area",
    "Descending deeper",
    "Approaching destination",
    "Refilling autoinjectors",
    "Collating affixes",
    "Researching loot tables",
  ];
  let loadingMessage = chooseRandomFromArray(loadingMessages, clientRngSingleton);
  if (loadingMessage instanceof Error) loadingMessage = "Loading";
  return (
    <main className="h-screen w-screen pt-10 flex flex-col items-center">
      <h1 className="mb-4">{loadingMessage}...</h1>
      <div className="h-10 w-10">
        <LoadingSpinner />
      </div>
    </main>
  );
}
