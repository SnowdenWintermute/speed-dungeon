import React from "react";

export default function FloatingMessageText({
  classNames,
  text,
}: {
  classNames?: string;
  text: string | number;
}) {
  return (
    <div className="relative mr-1">
      <div className={classNames}>{text}</div>
      <div className="absolute z-[-1] text-black top-[3px] left-[3px]">{text}</div>
    </div>
  );
}
