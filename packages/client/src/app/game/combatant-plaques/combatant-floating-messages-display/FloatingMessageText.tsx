import React from "react";

export default function FloatingMessageText({
  classNames,
  shadowTextClassnames,
  text,
}: {
  classNames?: string;
  shadowTextClassnames?: string;
  text: string | number;
}) {
  return (
    <div className="relative mr-1">
      <div className={classNames}>{text}</div>
      <div className={`${shadowTextClassnames} absolute z-[-1] text-black top-[3px] left-[3px]`}>
        {text}
      </div>
    </div>
  );
}
