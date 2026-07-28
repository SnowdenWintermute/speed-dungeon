"use client";
import React from "react";
import Link from "next/link";
import { usePendingNavigation } from "@/hooks/use-pending-navigation";
import { LADDER_PATHNAMES } from "./routes";

// a tab links to a bare pathname rather than a built route: the query schemas own what an absent
// param means, so arriving with none is arriving at the board's defaults
const LADDER_TABS = [
  { title: "Main", pathname: LADDER_PATHNAMES.MAIN },
  { title: "Progression Experience Points", pathname: LADDER_PATHNAMES.EXPERIENCE_POINTS },
  { title: "Deepest Cumulative Time To Clear", pathname: LADDER_PATHNAMES.CUMULATIVE_CLEAR_TIMES },
  { title: "Fastest Floor Clears", pathname: LADDER_PATHNAMES.FLOOR_CLEAR_TIMES },
];

export function LadderTabBar() {
  const { currentPathname, pendingPathnameOption, markPending } = usePendingNavigation();

  return (
    <nav className="w-full mb-6 border-b border-slate-400">
      <ul className="flex flex-wrap">
        {LADDER_TABS.map((tab) => {
          const isCurrent = isCurrentTab(tab.pathname, currentPathname);
          const isPending = tab.pathname === pendingPathnameOption;

          return (
            <li key={tab.pathname} className="mr-6">
              <Link
                href={tab.pathname}
                onClick={() => markPending(tab.pathname)}
                className={`inline-block pb-2 hover:underline ${
                  isCurrent || isPending ? "underline" : "text-slate-400"
                } ${isPending && !isCurrent ? "opacity-50" : ""}`}
              >
                {tab.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// every ladder page's path starts with the main one, so it is the only tab that has to match whole.
// the rest own their subtrees — a detail page reached from a board keeps that board's tab marked
function isCurrentTab(tabPathname: string, currentPathname: string): boolean {
  if (tabPathname === LADDER_PATHNAMES.MAIN) {
    return currentPathname === LADDER_PATHNAMES.MAIN;
  }
  return currentPathname.startsWith(tabPathname);
}
