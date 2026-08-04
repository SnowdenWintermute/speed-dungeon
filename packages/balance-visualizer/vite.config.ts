import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { fileURLToPath } from "node:url";

// common's barrel pulls in server modules that use node builtins — EventEmitter is extended at
// module scope, and the offline servers really do call crypto.randomBytes in the browser. next
// aliases these to its bundled polyfills automatically; vite externalizes them unless told not to
export default defineConfig({
  plugins: [react(), nodePolyfills()],
  resolve: {
    alias: {
      "@speed-dungeon/ui": fileURLToPath(new URL("../ui/src", import.meta.url)),
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
