import React from "react";

// complete class names, since a class assembled from a fragment at runtime is invisible to
// tailwind's scanner and never gets a rule generated
export interface ValueBarColors {
  border: string;
  background: string;
}

interface Props {
  maxValue: number;
  currentValue: number;
  colors: ValueBarColors;
  hideNumbers?: boolean;
  compactView?: boolean;
}

export default function ValueBar({
  maxValue,
  currentValue,
  colors,
  hideNumbers,
  compactView,
}: Props) {
  const percentOfMax = maxValue > 0 ? Math.round((currentValue / maxValue) * 100) : 0;
  const containerStyles = `relative h-full w-full border ${colors.border}`;
  const innerBarStyles = `h-full ${colors.background}`;

  return (
    <div className={containerStyles}>
      <div className={innerBarStyles} style={{ width: `${percentOfMax}%` }} />
      {!hideNumbers && (
        <div
          className={`${compactView ? "text-xs" : "text-s"} w-full text-center text-theme-emphasis absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`}
        >
          {currentValue} / {maxValue}
        </div>
      )}
    </div>
  );
}
