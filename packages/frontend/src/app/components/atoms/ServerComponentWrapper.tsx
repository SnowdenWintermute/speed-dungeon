"use client";
import React, { ReactNode } from "react";

export default function ServerComponentWrapper({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}
