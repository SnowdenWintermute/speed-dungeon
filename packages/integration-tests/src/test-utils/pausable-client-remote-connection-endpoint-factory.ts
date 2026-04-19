import { ClientRemoteConnectionEndpointFactory, ConnectionEndpoint } from "@speed-dungeon/common";
import { wrapAsPausable } from "./pausable-endpoint.js";

export class PausableClientRemoteConnectionEndpointFactory
  implements ClientRemoteConnectionEndpointFactory
{
  constructor(private inner: ClientRemoteConnectionEndpointFactory) {}

  createRemoteEndpoint(
    url: string,
    queryParams: { name: string; value: string }[]
  ): ConnectionEndpoint {
    return wrapAsPausable(this.inner.createRemoteEndpoint(url, queryParams));
  }
}
