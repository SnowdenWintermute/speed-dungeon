"use client";
import { SPACING_REM_LARGE, TOP_BAR_HEIGHT_REM, WEBSITE_NAME } from "@/client_consts";
import UserMenuContainer from "./user-menu";
import Link from "next/link";

export default function TopBar() {
  return (
    <section
      className={`bg-slate-700 w-full border-b border-b-slate-400 pt-[0.625rem] pb-[0.625rem]
        pointer-events-auto flex justify-between`}
      style={{
        height: `${TOP_BAR_HEIGHT_REM}rem`,
        paddingLeft: `${SPACING_REM_LARGE}rem`,
        paddingRight: `${SPACING_REM_LARGE}rem`,
      }}
    >
      <Link href="/" className="h-full flex items-center">
        <img src="speed-dungeon-logo.svg" className="h-full pr-[0.625rem]" />
        <h1 className="text-3xl flex items-end relative">
          <span className="pr-[0.625rem]">{WEBSITE_NAME}</span>
          <span className="text-sm ">alpha 0.9.0 ⓘ </span>
        </h1>
      </Link>
      <UserMenuContainer />
    </section>
  );
}
