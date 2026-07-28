"use client";
import Link from "next/link";
import React, { ReactNode } from "react";
import { usePendingLink } from "@/hooks/use-pending-navigation";

// every ladder link that is not in a table cell: a fact on a record page, a name in a roster, the way
// to a full board. it does not truncate, unlike LadderTableCellLink — nothing here is confined to a
// column, and a party name cut short in a one-line summary would be worse than a wrapped one.
// a clicked link marks itself the same way the navs and the cell links do
export function LadderLink({ href, children }: { href: string; children: ReactNode }) {
  const { isPending, markPending } = usePendingLink(href);

  return (
    <Link
      href={href}
      onClick={markPending}
      className={`hover:underline ${isPending ? "underline opacity-50" : ""}`}
    >
      {children}
    </Link>
  );
}
