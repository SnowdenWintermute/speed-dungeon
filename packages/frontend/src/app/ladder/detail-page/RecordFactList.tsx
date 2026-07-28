import React, { ReactNode } from "react";

export interface RecordFact {
  label: string;
  value: ReactNode;
}

// the summary above a record page's tables. a definition list rather than a table: these are facts
// about one thing, not rows of like things — the label column sizes to the longest label and the
// values take the rest
export function RecordFactList({ facts }: { facts: RecordFact[] }) {
  return (
    <dl className="mb-8 grid grid-cols-[max-content_1fr] gap-x-6 gap-y-1">
      {facts.map((fact) => (
        <React.Fragment key={fact.label}>
          <dt className="text-slate-400">{fact.label}</dt>
          <dd>{fact.value}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
}
