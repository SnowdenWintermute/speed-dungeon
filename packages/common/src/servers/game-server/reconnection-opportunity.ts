import { Milliseconds, Username } from "../../aliases.js";

export class ReconnectionOpportunity {
  private timeout: NodeJS.Timeout | null;
  private active = true;

  constructor(
    duration: Milliseconds,
    public readonly username: Username,
    private readonly onExpire: () => void
  ) {
    console.log("expire timeout set for", username, duration);
    this.timeout = setTimeout(() => {
      this.expire();
      console.log("expired", username);
    }, duration);
  }

  get isActive() {
    return this.active;
  }

  /** Attempt to claim this opportunity for reconnection */
  claim(): boolean {
    if (!this.active) {
      return false;
    }

    this.active = false;

    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    return true; // claim is allowed
  }

  /** Called by timeout or externally to expire the opportunity */
  expire(): void {
    if (!this.active) {
      return;
    }

    this.active = false;

    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    this.onExpire();
  }
}
