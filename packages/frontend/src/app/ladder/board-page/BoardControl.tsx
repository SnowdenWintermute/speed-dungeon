import React, { ReactNode } from "react";

// a selector is a dropdown that fills its parent, so the parent is what gives it a width, and every
// control above a board gets the same one
export function BoardControl({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="w-52 mr-4 mb-4">
      <span className="block mb-1 text-slate-400">{label}</span>
      {children}
    </div>
  );
}
