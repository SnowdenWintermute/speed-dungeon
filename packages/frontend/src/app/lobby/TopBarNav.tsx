"use client";
import React from "react";
import Link from "next/link";
import { usePendingNavigation } from "@/hooks/use-pending-navigation";

// the game is the heaviest page in the app to navigate to, so the click that goes there is the one
// that most needs acknowledging
const TOP_BAR_NAV_ITEMS = [
  { title: "Game", pathname: "/", ownsSubtree: false },
  { title: "Ladder", pathname: "/ladder", ownsSubtree: true },
];

export function TopBarNav() {
  const { currentPathname, pendingPathnameOption, markPending } = usePendingNavigation();

  return (
    <ul className="h-full flex items-end text-lg">
      {TOP_BAR_NAV_ITEMS.map((item) => {
        const isCurrent = item.ownsSubtree
          ? currentPathname.startsWith(item.pathname)
          : currentPathname === item.pathname;
        const isPending = item.pathname === pendingPathnameOption;

        return (
          <li
            key={item.pathname}
            className={`mr-4 ${isCurrent || isPending ? "underline" : ""} ${
              isPending && !isCurrent ? "opacity-50" : ""
            }`}
          >
            <Link href={item.pathname} onClick={() => markPending(item.pathname)}>
              {item.title}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
