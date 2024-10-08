import React, { ReactNode } from "react";
import TopBar from "../../lobby/TopBar";

export default function WithTopBar({ children }: { children: ReactNode }) {
  return (
    <main className="h-full w-full text-zinc-300 relative">
      <TopBar />
      {children}
    </main>
  );
}
