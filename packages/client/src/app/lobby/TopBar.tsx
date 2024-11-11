"use client";
import { SPACING_REM_LARGE, TOP_BAR_HEIGHT_REM, WEBSITE_NAME } from "@/client_consts";
import UserMenuContainer from "./user-menu";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Settings from "@/app/settings";

export default function TopBar() {
  const pathName = usePathname();

  return (
    <>
      {<Settings />}
      <section
        className={`bg-slate-700 w-full border-b border-b-slate-400 pt-[0.625rem] pb-[0.625rem]
        pointer-events-auto flex justify-between`}
        style={{
          height: `${TOP_BAR_HEIGHT_REM}rem`,
          paddingLeft: `${SPACING_REM_LARGE}rem`,
          paddingRight: `${SPACING_REM_LARGE}rem`,
        }}
      >
        <div className="h-full flex items-center">
          <Link href="/" className="h-full flex mr-8 ">
            <img
              src="/speed-dungeon-logo.svg"
              alt="speed dungeon logo"
              className="h-full pr-[0.625rem]"
            />
            <h1 className="desktop:text-3xl laptop:text-2xl flex items-end relative">
              <span className="pr-[0.625rem]">{WEBSITE_NAME}</span>
              <span className="text-sm ">alpha 0.9.0 ⓘ </span>
            </h1>
          </Link>
          <div className="h-full w-[1px] bg-slate-400 mr-8" />
          <ul className="h-full flex items-end text-lg">
            <li className={`${pathName === `/` && "underline"} mr-4`}>
              <Link href={"/"}>Game</Link>
            </li>
            <li>
              <Link
                href={"/ladder/1"}
                className={`${pathName.split("/")[1] === `ladder` && "underline"} mr-4`}
              >
                Ladder
              </Link>
            </li>
          </ul>
        </div>
        <UserMenuContainer />
      </section>
    </>
  );
}
