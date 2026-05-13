export interface ReconnectionTokenStore {
  get guestGameReconnectionToken(): null | string;
  set guestGameReconnectionToken(value: string);
  clearGuestGameReconnectionToken(): void;
}

export class InMemoryReconnectionTokenStore {
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

export class LocalStorageReconnectionTokenStore {
  private static readonly KEY = "guestGameReconnectionToken";

  get guestGameReconnectionToken(): null | string {
    return localStorage.getItem(LocalStorageReconnectionTokenStore.KEY);
  }

  set guestGameReconnectionToken(value: string) {
    localStorage.setItem(LocalStorageReconnectionTokenStore.KEY, value);
  }

  clearGuestGameReconnectionToken() {
    localStorage.removeItem(LocalStorageReconnectionTokenStore.KEY);
  }
}
