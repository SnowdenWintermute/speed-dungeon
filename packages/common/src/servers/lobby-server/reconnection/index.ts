import { PlayerReconnectionProtocol } from "../../reconnection-protocol/index.js";

export class LobbyReconnectionProtocol implements PlayerReconnectionProtocol {
  onPlayerDisconnected(...args: any[]): Promise<void> {
    throw new Error("Method not implemented.");
  }
  issueReconnectionCredential(...args: any[]): Promise<void> {
    throw new Error("Method not implemented.");
  }
  attemptReconnectionClaim(...args: any[]): Promise<void> {
    throw new Error("Method not implemented.");
  }
  // async evaluateAdmission(attempt: ReconnectionAttempt): Promise<LobbyAdmissionDecision>;
}
