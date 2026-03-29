"use client";
import { ClientApplication } from "@/client-application";
import { createContext, useContext } from "react";

export const ClientApplicationContext = createContext<ClientApplication | null>(null);

export function useClientApplication(): ClientApplication {
  const value = useContext(ClientApplicationContext);

  if (!value) {
    throw new Error("ClientApplication not initialized");
  }

  return value;
}
