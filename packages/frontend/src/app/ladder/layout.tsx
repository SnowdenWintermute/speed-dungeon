import React, { ReactNode } from "react";
import { SPACING_REM_LARGE, TOP_BAR_HEIGHT_REM } from "@/client-consts";
import WithTopBar from "../components/layouts/with-top-bar";
import { LadderTabBar } from "./LadderTabBar";

// every ladder page is this: the site's top bar, one scrolling region under it, and the tab bar at
// the top of the column. a scrolling flex container drops its end padding from the scrollable area,
// so the scroller is plain block layout and the bottom spacing sits on the column inside it
export default function LadderLayout({ children }: { children: ReactNode }) {
  return (
    <WithTopBar>
      <div
        className="w-full overflow-y-auto pointer-events-auto"
        style={{
          height: `calc(100vh - ${TOP_BAR_HEIGHT_REM}rem)`,
          padding: `${SPACING_REM_LARGE}rem`,
          paddingBottom: 0,
        }}
      >
        <div className="w-full max-w-[60rem] mx-auto pb-24">
          <LadderTabBar />
          {children}
        </div>
      </div>
    </WithTopBar>
  );
}
