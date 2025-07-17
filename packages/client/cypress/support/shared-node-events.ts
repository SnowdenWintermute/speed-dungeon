import io from "socket.io-client";
import { CYPRESS_SYNC_SERVER_PORT } from "./multi-cypress-sync-server";

export default function sharedNodeEvents(on: Cypress.PluginEvents, _: Cypress.PluginConfigOptions) {
  const socket = io(`http://localhost:${CYPRESS_SYNC_SERVER_PORT}`);
  let checkpointName: String;
  socket.on("checkpoint", (name: String) => {
    checkpointName = name;
  });

  on("task", {
    // tasks for syncing multiple Cypress instances together
    checkpoint(name) {
      socket.emit("checkpoint", name);

      return null;
    },
    waitForCheckpoint(name) {
      // TODO: set maximum waiting time
      return new Promise((resolve) => {
        const i = setInterval(() => {
          if (checkpointName === name) {
            clearInterval(i);
            resolve(name);
          }
        }, 1000);
      });
    },
  });
}
