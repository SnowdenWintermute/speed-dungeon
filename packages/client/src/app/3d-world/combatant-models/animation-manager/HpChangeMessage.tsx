import { ZIndexLayers } from "@/app/z-index-layers";
import React from "react";

export default function HpChangeMessage(
  classNames: string,
  styles: { [key: string]: number | string },
  text: string
) {
  return (
    <div>
      <div className={classNames}>{text}</div>
      <div
        className={`absolute text-black top-[3px] left-[3px]`}
        style={{ zIndex: ZIndexLayers.FloatingMessages, textShadow: "2px 2px 2px #000000" }}
      >
        {text}
      </div>
    </div>
  );
}
