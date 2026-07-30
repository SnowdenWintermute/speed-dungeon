import React, { ReactNode } from "react";
import ScrollingPageColumn from "../components/layouts/scrolling-page-column";
import { LadderTabBar } from "./LadderTabBar";
import { Settings } from "../settings";

// every ladder page is the shared reading shell with the tab bar at the top of the column
export default function LadderLayout({ children }: { children: ReactNode }) {
  return (
    <ScrollingPageColumn>
      <Settings />
      <LadderTabBar />
      {children}
    </ScrollingPageColumn>
  );
}
