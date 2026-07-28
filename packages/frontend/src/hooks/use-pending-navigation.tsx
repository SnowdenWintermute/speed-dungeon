"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

// a nav link that only highlights once it is the current path reads as a dead click: the pathname is
// still the old one until the page being navigated to has been fetched, which is a round trip at best
// and a route compile in dev. so a clicked link marks itself from local state, which is immediate no
// matter what the router is waiting on, and the mark is dropped once the navigation lands.
// the logic is shared; what a pending or current link looks like belongs to each nav
export function usePendingNavigation() {
  const currentPathname = usePathname();
  const [pendingPathnameOption, setPendingPathnameOption] = useState<string>();

  useEffect(() => {
    setPendingPathnameOption(undefined);
  }, [currentPathname]);

  return { currentPathname, pendingPathnameOption, markPending: setPendingPathnameOption };
}
