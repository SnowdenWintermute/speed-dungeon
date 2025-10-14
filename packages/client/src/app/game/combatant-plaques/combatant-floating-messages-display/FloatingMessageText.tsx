import { ZIndexLayers } from "@/app/z-index-layers";
import { observer } from "mobx-react-lite";
import React from "react";

export const FloatingMessageText = observer(
  ({
    classNames,
    text,
  }: {
    classNames?: string;
    shadowTextClassnames?: string;
    text: string | number;
  }) => {
    return (
      <div
        className={classNames}
        style={{ zIndex: ZIndexLayers.FloatingMessages, textShadow: "2px 2px 0px #000000" }}
      >
        {text}
      </div>
    );
  }
);
