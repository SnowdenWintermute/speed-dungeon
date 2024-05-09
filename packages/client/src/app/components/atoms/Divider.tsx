import React from "react";

interface Props {
  extraStyles?: string;
}

export default function Divider(props: Props) {
  return (
    <div
      className={`
    bg-slate-400 h-[1px] flex mt-2 mb-2 ${props.extraStyles}
    `}
    />
  );
}
