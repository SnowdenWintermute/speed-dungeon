import { SPACING_REM_LARGE, SPACING_REM_SMALL } from "@/client_consts";
import { UserPlaque } from "./UserPlaque";
import LoadingSpinner from "@/app/components/atoms/LoadingSpinner";
import { observer } from "mobx-react-lite";
import { AppStore } from "@/mobx-stores/app-store";

export const UserList = observer(() => {
  const { lobbyStore } = AppStore.get();
  const usersInChannel = lobbyStore.getUsersList();
  const websocketConnected = lobbyStore.websocketConnected;

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
        {websocketConnected ? "In lobby" : "Connecting"}
        {websocketConnected ? (
          ` - ${usersInChannel.length}`
        ) : (
          <span className="ml-2 h-4 w-4 inline">
            <LoadingSpinner />
          </span>
        )}
      </h2>
      <ul className="list-none flex-grow overflow-y-auto pointer-events-auto">
        {websocketConnected &&
          usersInChannel.map(([username, displayData]) => (
            <UserPlaque username={username} displayData={displayData} key={username} />
          ))}
      </ul>
    </section>
  );
});
