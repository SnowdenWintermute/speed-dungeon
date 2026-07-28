import React, { ReactNode } from "react";
import ScrollingPageColumn from "../components/layouts/scrolling-page-column";

// a profile is reached from a name anywhere in the ladder, but it is not a ladder board, so it gets
// the shared shell without the tab bar — there is no tab for it to be under
export default function ProfileLayout({ children }: { children: ReactNode }) {
  return <ScrollingPageColumn>{children}</ScrollingPageColumn>;
}
