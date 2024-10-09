import { SPACING_REM_LARGE, SPACING_REM_SMALL } from "@/client_consts";
import { useWebsocketStore } from "@/stores/websocket-store";
import UserPlaque from "./UserPlaque";

export default function UserList() {
  const usersInChannel = useWebsocketStore().usersInMainChannel;
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
      className="w-full max-h-full flex flex-col"
      style={{
        paddingTop: `${SPACING_REM_LARGE}rem`,
        paddingLeft: `${SPACING_REM_SMALL}rem`,
        paddingBottom: `${SPACING_REM_SMALL}rem`,
      }}
    >
      <h2 className="text-slate-200 text-l mb-2 pointer-events-auto w-fit">
        {"In lobby"} - {usersArray.length}
      </h2>
      <ul className="list-none flex-grow overflow-y-auto pointer-events-auto">
        {usersArray.map(([username, displayData]) => (
          <UserPlaque username={username} displayData={displayData} key={username} />
        ))}
      </ul>
    </section>
  );
}
