import React from "react";

interface Props {
  maxValue: number;
  currentValue: number;
  color: string;
  hideNumbers?: boolean;
  compactView?: boolean;
}

export default function ValueBar({
  maxValue,
  currentValue,
  color,
  hideNumbers,
  compactView,
}: Props) {
  const percentOfMax = maxValue > 0 ? Math.round((currentValue / maxValue) * 100) : 0;
  const containerStyles = `relative h-full w-full border border-${color}`;
  const innerBarStyles = `h-full bg-${color}`;

  return (
    <div className={containerStyles}>
      <div className={innerBarStyles} style={{ width: `${percentOfMax}%` }} />
      {!hideNumbers && (
        <div
          className={`${compactView ? "text-xs" : "text-s"} w-full text-center text-zinc-296 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`}
        >
          {currentValue} / {maxValue}
        </div>
      )}
    </div>
  );
}
