import { SPACING_REM_LARGE, SPACING_REM_SMALL } from "@/client-consts";
import { UserPlaque } from "./UserPlaque";
import LoadingSpinner from "@/app/components/atoms/LoadingSpinner";
import { observer } from "mobx-react-lite";
import { useClientApplication } from "@/hooks/create-client-application-context";

export const UserList = observer(() => {
  const clientApplication = useClientApplication();
  const { lobbyContext, uiStore } = clientApplication;
  const { usersList } = lobbyContext.channel;
  const clientConnected = uiStore.connectionStatus.isConnected;

  return (
    <section
      className="w-full max-h-full flex flex-col min-h-40"
      style={{
        paddingTop: `${SPACING_REM_LARGE}rem`,
        paddingLeft: `${SPACING_REM_SMALL}rem`,
        paddingBottom: `${SPACING_REM_SMALL}rem`,
      }}
    >
      <h2 className="text-slate-200 text-l mb-2 pointer-events-auto w-fit flex items-center">
        {clientConnected ? "In lobby" : "Connecting"}
        {clientConnected ? (
          ` - ${usersList.length}`
        ) : (
          <span className="ml-2 h-4 w-4 inline">
            <LoadingSpinner />
          </span>
        )}
      </h2>
      <ul className="list-none flex-grow overflow-y-auto pointer-events-auto">
        {clientConnected &&
          usersList.map(([username, displayData]) => (
            <UserPlaque username={username} displayData={displayData} key={username} />
          ))}
      </ul>
    </section>
  );
});
