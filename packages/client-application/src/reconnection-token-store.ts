export class ReconnectionTokenStore {
  private _guestGameReconnectionToken: null | string = null;

  get guestGameReconnectionToken(): null | string {
    return this._guestGameReconnectionToken;
  }

  set guestGameReconnectionToken(value: string) {
    this._guestGameReconnectionToken = value;
  }

  clearGuestGameReconnectionToken() {
    this._guestGameReconnectionToken = null;
  }
}
