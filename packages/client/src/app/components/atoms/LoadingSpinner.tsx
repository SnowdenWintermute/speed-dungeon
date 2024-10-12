import React from "react";

export default function LoadingSpinner({ extraStyles = "" }: { extraStyles?: string }) {
  return (
    <div
      className={`animate-spin-full rounded-full h-full w-full
                  border-r-2 border-l-2 border-b-2 border-t-2 border-slate-400 border-r-transparent
                  ${extraStyles} `}
    />
  );
}
