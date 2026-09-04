import { createContext, ReactNode, useContext } from "react";
import { BalanceToolsApplication } from "./balance-tools-application.ts";

const BalanceToolsApplicationContext = createContext<null | BalanceToolsApplication>(null);

export function BalanceToolsApplicationProvider({
  application,
  children,
}: {
  application: BalanceToolsApplication;
  children: ReactNode;
}) {
  return (
    <BalanceToolsApplicationContext.Provider value={application}>
      {children}
    </BalanceToolsApplicationContext.Provider>
  );
}

export function useBalanceToolsApplication() {
  const application = useContext(BalanceToolsApplicationContext);
  if (application === null) {
    throw new Error("BalanceToolsApplication was not provided");
  }

  return application;
}
