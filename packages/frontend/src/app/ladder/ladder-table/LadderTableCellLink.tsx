import Link from "next/link";
import React, { ReactNode } from "react";

// boards render their own cell contents, so links are a component rather than a class string they
// each have to remember to apply
export function LadderTableCellLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="hover:underline">
      {children}
    </Link>
  );
}
