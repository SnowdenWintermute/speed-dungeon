import React from "react";

interface Props {
  children: React.ReactNode;
}

export default function ChangeTargetButtons({ children }: Props) {
  return (
    <ul
      className={`flex list-none border border-slate-400 bg-slate-700 w-full justify-between items-center`}
    >
      {children}
    </ul>
  );
}
