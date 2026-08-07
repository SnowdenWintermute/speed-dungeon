import React from "react";
import { IconName, SVG_ICONS } from "@/app/icons";

// packages/ui carries no icons of its own, so the app supplies the one its shared table draws
export function renderSortIndicator(isDescending: boolean) {
  return SVG_ICONS[IconName.Chevron](
    `h-full fill-zinc-300 ${isDescending ? "-rotate-90" : "rotate-90"}`
  );
}
