"use client";
import Link from "next/link";
import React, { ReactNode } from "react";
import { usePendingLink } from "@/hooks/use-pending-navigation";

// boards render their own cell contents, so links are a component rather than a class string they
// each have to remember to apply.
// it truncates itself rather than relying on the cell to do it: in a stacked cell there is no single
// line for the cell to clip, so each line owns its own ellipsis. block is what gives the anchor a box
// to overflow — an inline one cannot be truncated.
// it marks itself while its page is on the way, as the navs do: a row's link leads to a page nobody
// has compiled yet in dev, and one that costs a round trip even in production
export function LadderTableCellLink({ href, children }: { href: string; children: ReactNode }) {
  const { isPending, markPending } = usePendingLink(href);

  return (
    <Link
      href={href}
      onClick={markPending}
      className={`block truncate hover:underline ${isPending ? "underline opacity-50" : ""}`}
    >
      {children}
    </Link>
  );
}
