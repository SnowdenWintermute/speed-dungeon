import { makeAutoObservable } from "mobx";
import { instanceToPlain, plainToInstance } from "class-transformer";
import { Milliseconds } from "../aliases.js";
import { ReactiveNode, Serializable, SerializedOf } from "../serialization/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";

export class GameClock implements ReactiveNode, Serializable {
  private firstStartedAt: null | Milliseconds = null;
  private accumulatedLivePlayTimeMs: Milliseconds = 0;
  private anchor: null | Milliseconds = null;

  makeObservable() {
    makeAutoObservable(this);
  }

  toSerialized() {
    return instanceToPlain(this);
  }

  static fromSerialized(serialized: SerializedOf<GameClock>) {
    return plainToInstance(GameClock, serialized);
  }

  isLive() {
    return this.anchor !== null;
  }

  requireLive() {
    if (this.anchor === null) {
      throw new Error(ERROR_MESSAGES.GAME.NOT_LIVE);
    }
  }

  hasEverStarted() {
    return this.firstStartedAt !== null;
  }

  getFirstStartedAt() {
    return this.firstStartedAt;
  }

  requireFirstStartedAt(): Milliseconds {
    if (this.firstStartedAt === null) {
      throw new Error("GameClock.requireFirstStartedAt called when game has not yet started");
    }
    return this.firstStartedAt;
  }

  startLiveSession() {
    if (this.anchor !== null) {
      throw new Error("GameClock.startLiveSession called when clock is already live");
    }
    if (this.firstStartedAt === null) {
      this.firstStartedAt = Date.now();
    }
    this.anchor = Date.now();
  }

  updateAccumulatedPlayTime() {
    if (this.anchor === null) {
      throw new Error("GameClock.updateAccumulatedPlayTime called when clock is not live");
    }
    const now = Date.now();
    this.accumulatedLivePlayTimeMs += now - this.anchor;
    this.anchor = now;
  }

  endLiveSession() {
    if (this.anchor === null) {
      throw new Error("GameClock.endLiveSession called when clock is not live");
    }
    this.accumulatedLivePlayTimeMs += Date.now() - this.anchor;
    this.anchor = null;
  }

  discardLiveSession() {
    if (this.anchor === null) {
      throw new Error("GameClock.discardLiveSession called when clock is not live");
    }
    this.anchor = null;
  }

  getTotalLivePlayTimeMs(): Milliseconds {
    if (this.anchor === null) {
      return this.accumulatedLivePlayTimeMs;
    }
    return this.accumulatedLivePlayTimeMs + (Date.now() - this.anchor);
  }
}
