import React from "react";
import { CONSUMABLE_TEXT_COLOR } from "@speed-dungeon/common";

// use the safelist parameter in tailwind config for string classes
// which are conditionally applied at runtime. The tailwind.config.ts however
// can not use imported string consts, so we'll force them to be built in here
export default function TailwindClassLoader() {
  return (
    <div id=" tailwind-inline-safelist-for-imported-consts" aria-hidden className="hidden">
      <div className={CONSUMABLE_TEXT_COLOR} />
    </div>
  );
}
