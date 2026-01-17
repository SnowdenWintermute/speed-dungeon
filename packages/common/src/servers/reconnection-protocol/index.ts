export interface PlayerReconnectionProtocol {
  onPlayerDisconnected(...args: any[]): Promise<void>;
  issueReconnectionCredential(...args: any[]): Promise<void>;
  attemptReconnectionClaim(...args: any[]): Promise<void>;
}
