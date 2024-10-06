import { SPACING_REM_LARGE, SPACING_REM_SMALL } from "@/client_consts";
import { useWebsocketStore } from "@/stores/websocket-store";
import cloneDeep from "lodash.clonedeep";
import { useEffect, useState } from "react";

export default function UserList() {
  const usernamesInMainChannel = useWebsocketStore().usernamesInMainChannel;
  const mainChannelName = useWebsocketStore().mainChannelName;
  const usernamesArray = Array.from(usernamesInMainChannel.values());

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
        {"In lobby"} - {usernamesArray.length}
      </h2>
      <ul className="list-none flex-grow overflow-y-auto pointer-events-auto">
        {usernamesArray.map((username) => (
          <li
            className="h-10 bg-slate-700 border border-slate-400 flex items-center mb-2 pointer-events-auto"
            style={{
              marginRight: `${SPACING_REM_SMALL}rem`,
            }}
            key={username}
          >
            <div className="pl-2 overflow-hidden whitespace-nowrap text-ellipsis">{username}</div>
          </li>
        ))}
      </ul>
    </section>
  );
}
