import Link from "next/link";
import React, { ReactNode } from "react";

// boards render their own cell contents, so links are a component rather than a class string they
// each have to remember to apply.
// it truncates itself rather than relying on the cell to do it: in a stacked cell there is no single
// line for the cell to clip, so each line owns its own ellipsis. block is what gives the anchor a box
// to overflow — an inline one cannot be truncated
export function LadderTableCellLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="block truncate hover:underline">
      {children}
    </Link>
  );
}
