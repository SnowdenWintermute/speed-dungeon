// deliberately import-free: the vite config and the client both read this, and taking it from the
// plugin file instead would pull node:fs into the client bundle, where nodePolyfills shims it
// rather than failing
export const WRITE_GENERATED_FILE_ROUTE = "/__write-generated-file";

/**
 * Saved runs are read back through the dev server rather than served out of public/. Two reasons:
 * vite registers publicDir once at startup, so a run saved into a directory that did not exist when
 * the server booted is silently answered by the SPA fallback instead; and that fallback returns
 * index.html with a 200, which makes a missing run indistinguishable from a present one by status.
 */
export const READ_SAVED_RUN_ROUTE = "/__saved-run";
