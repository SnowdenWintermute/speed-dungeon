import { TEST_CONNECTION_ENDPOINT_FACTORIES } from "@/servers/fixtures/test-connection-endpoint-factories";

describe.each(TEST_CONNECTION_ENDPOINT_FACTORIES)(
  "$name reconnection flow",
  ({ clientEndpointFactory }) => {
    // auth and guest versions needed:
    it("reconnection success", async () => {
      console.log("reconnection success test");
    });
  }
);
