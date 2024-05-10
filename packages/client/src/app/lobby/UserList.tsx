import { useWebsocketStore } from "@/stores/websocket-store";

export default function UserList() {
  const usernamesInMainChannel = useWebsocketStore().usernamesInMainChannel;
  const mainChannelName = useWebsocketStore().mainChannelName;

  return (
    <section className="min-w-[16rem] w-[16rem] bg-slate-700 border border-slate-400 p-4 pointer-events-auto">
      <h2 className="text-slate-200 text-l mb-2">
        {"Channel: "} {mainChannelName}
      </h2>
      <ul className="list-none">
        {Array.from(usernamesInMainChannel).map((username) => (
          <li
            className="h-10 border border-slate-400 flex items-center mb-2"
            key={username}
          >
            <div className="pl-2 overflow-hidden whitespace-nowrap text-ellipsis">
              {username}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
