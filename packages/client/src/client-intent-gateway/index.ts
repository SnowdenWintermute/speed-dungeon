import { ClientIntent } from "@speed-dungeon/common";

export interface ClientIntentHandler {
  handleIntent(clientIntent: ClientIntent): void;
}

export class ClientIntentGateway {
  constructor(private readonly intentHandler: ClientIntentHandler) {}

  submit(clientIntent: ClientIntent): void {
    this.intentHandler.handleIntent(clientIntent);
  }
}
