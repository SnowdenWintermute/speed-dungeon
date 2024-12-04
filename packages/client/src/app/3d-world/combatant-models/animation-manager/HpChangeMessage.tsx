import React from "react";

export default function HpChangeMessage(
  classNames: string,
  styles: { [key: string]: number | string },
  text: string
) {
  return (
    <div>
      <div className={classNames}>{text}</div>
      <div className="absolute z-[-1] text-black top-[3px] left-[3px]">{text}</div>
    </div>
  );
}
