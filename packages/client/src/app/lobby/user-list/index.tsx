import { SPACING_REM_LARGE, SPACING_REM_SMALL } from "@/client_consts";
import UserPlaque from "./UserPlaque";
import { useLobbyStore } from "@/stores/lobby-store";
import LoadingSpinner from "@/app/components/atoms/LoadingSpinner";

export default function UserList() {
  const websocketConnected = useLobbyStore().websocketConnected;
  const usersInChannel = useLobbyStore().usersInMainChannel;
  const usersArray = Object.entries(usersInChannel);

  // useEffect(() => {
  //   const newList = cloneDeep(usernamesInMainChannelArray);
  //   for (let i = 100; i > 0; i -= 1) {
  //     newList.push("some realllllylonnng name");
  //   }
  //   setUsernamesInMainChannelArray(newList);
  // }, []);

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
        {websocketConnected ? "In lobby" : "connecting"}
        {websocketConnected ? (
          ` - ${usersArray.length}`
        ) : (
          <span className="ml-2 h-4 w-4 inline">
            <LoadingSpinner />
          </span>
        )}
      </h2>
      <ul className="list-none flex-grow overflow-y-auto pointer-events-auto">
        {websocketConnected &&
          usersArray.map(([username, displayData]) => (
            <UserPlaque username={username} displayData={displayData} key={username} />
          ))}
      </ul>
    </section>
  );
}
