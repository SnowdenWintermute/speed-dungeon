import { ZIndexLayers } from "@/app/z-index-layers";
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
      <div
        className={`${shadowTextClassnames} absolute text-black top-[3px] left-[3px]`}
        style={{ zIndex: ZIndexLayers.FloatingMessagesTextShadow }}
      >
        {text}
      </div>
    </div>
  );
}
