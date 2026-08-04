import React from "react";
import LoadingSpinner from "@speed-dungeon/ui/atoms/LoadingSpinner";

// the instant loading state for every page under /ladder. without one, a navigation shows the page
// it is leaving until the next one is ready, which reads as a dead click.
// it renders inside the ladder layout, so the top bar and the tab bar stay put and only the content
// area swaps — unlike the root loading.tsx, which replaces the whole screen
export default function LadderLoading() {
  return (
    <div className="h-10 w-10">
      <LoadingSpinner />
    </div>
  );
}
