import HotkeyButton from "@/app/components/atoms/HotkeyButton";
import { NextOrPrevious } from "@speed-dungeon/common";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React from "react";

export default function PageSelector() {
  const searchParams = useSearchParams();
  const pageParam = searchParams.get("page") || "0";
  const page = parseInt(pageParam);
  const pathname = usePathname();
  const { replace } = useRouter();

  function changePage(direction: NextOrPrevious) {
    const params = new URLSearchParams(searchParams);
    let newPage;
    switch (direction) {
      case NextOrPrevious.Next:
        newPage = page + 1;
        break;
      case NextOrPrevious.Previous:
        newPage = page - 1;
        break;
    }
    params.set("page", newPage.toString());
    replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div>
      <div className="pointer-events-auto">
        <HotkeyButton
          hotkeys={["KeyW"]}
          className="h-10 pr-2 pl-2 border border-slate-400"
          onClick={() => {
            changePage(NextOrPrevious.Previous);
          }}
        >
          Previous
        </HotkeyButton>
        <HotkeyButton
          hotkeys={["KeyE"]}
          className="h-10 pr-2 pl-2 border border-slate-400"
          onClick={() => {
            changePage(NextOrPrevious.Next);
          }}
        >
          Next
        </HotkeyButton>
      </div>
    </div>
  );
}
