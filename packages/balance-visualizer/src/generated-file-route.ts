// deliberately import-free: the vite config and the client both read this, and taking it from the
// plugin file instead would pull node:fs into the client bundle, where nodePolyfills shims it
// rather than failing
export const WRITE_GENERATED_FILE_ROUTE = "/__write-generated-file";
