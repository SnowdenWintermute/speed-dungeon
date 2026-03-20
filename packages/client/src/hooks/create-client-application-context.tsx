import { createContext, useContext } from "react";
import { ClientApplication } from "../client-application";

export const ClientApplicationContext = createContext<ClientApplication | null>(null);

export function useClientApplication(): ClientApplication {
  const value = useContext(ClientApplicationContext);

  if (!value) {
    throw new Error("ClientApplication not initialized");
  }

  return value;
}
