/** Its own module, importing nothing, because both halves of the write need it: the dev server
 * plugin that installs the route and the browser that posts to it. Taking it from the plugin instead
 * would pull node:fs into the client bundle, where nodePolyfills would shim it rather than fail. */
export const WRITE_GENERATED_EVASION_ROUTE = "/__write-generated-evasion";
