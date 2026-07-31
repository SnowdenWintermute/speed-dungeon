import React from "react";
import LoadingScreen from "./components/atoms/LoadingScreen";
import { ArrayUtils, BasicRandomNumberGenerator } from "@speed-dungeon/common";

export default function Loading() {
  const loadingMessages = [
    "Travelling to a new area",
    "Descending deeper",
    "Approaching destination",
    "Refilling autoinjectors",
    "Collating affixes",
    "Researching loot tables",
  ];
  let loadingMessage = ArrayUtils.chooseRandom(loadingMessages, new BasicRandomNumberGenerator());
  if (loadingMessage instanceof Error) loadingMessage = "Loading";
  return <LoadingScreen message={loadingMessage} />;
}
