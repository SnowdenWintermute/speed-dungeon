import React, { ReactNode } from "react";
import { SPACING_REM_LARGE, TOP_BAR_HEIGHT_REM } from "@/client-consts";
import WithTopBar from "./with-top-bar";

// the shell every page that is read rather than played shares: the site's top bar and one scrolling
// column under it, centered and width-capped. the ladder adds its tab bar inside this; a profile is
// the same page furniture without one.
// a scrolling flex container drops its end padding from the scrollable area, so the scroller is
// plain block layout and the bottom spacing sits on the column inside it
export default function ScrollingPageColumn({ children }: { children: ReactNode }) {
  return (
    <WithTopBar>
      <div
        className="w-full overflow-y-auto pointer-events-auto"
        style={{
          height: `calc(100vh - ${TOP_BAR_HEIGHT_REM}rem)`,
          padding: `${SPACING_REM_LARGE}rem`,
        }}
      >
        <div className="w-full max-w-[60rem] mx-auto pb-24">{children}</div>
      </div>
    </WithTopBar>
  );
}
