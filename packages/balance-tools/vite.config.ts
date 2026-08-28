import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { fileURLToPath } from "node:url";
import { writeGeneratedFilePlugin } from "./write-generated-file-plugin";

// common's barrel pulls in server modules that use node builtins — EventEmitter is extended at
// module scope, and the offline servers really do call crypto.randomBytes in the browser. next
// aliases these to its bundled polyfills automatically; vite externalizes them unless told not to
export default defineConfig({
  plugins: [react(), nodePolyfills(), writeGeneratedFilePlugin()],
  // a saved run is a multi-megabyte file written while the page is open, and a reload would discard
  // the very run being saved. these are read on demand through the dev server's own route, so
  // nothing needs to watch them
  server: { watch: { ignored: ["**/saved-runs/**"] } },
  // the analysis worker imports the same common barrel the app does, so it needs the polyfills too.
  // worker bundles do not inherit the top level plugins
  worker: { format: "es", plugins: () => [nodePolyfills()] },
  resolve: {
    alias: {
      "@speed-dungeon/ui": fileURLToPath(new URL("../ui/src", import.meta.url)),
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
