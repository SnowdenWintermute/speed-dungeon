import { createClient, RedisClientType, SetOptions } from "redis";
import { env } from "../validate-env.js";

const CONNECTION_TIMEOUT_MS = 3000;

export class ValkeyManager {
  client: RedisClientType;
  connected: boolean = false;
  constructor(public keyPrefix: string) {
    console.log("connecting to valkey at", env.VALKEY_URL);
    this.client = createClient({
      url: env.VALKEY_URL,
    });

    this.client.on("connect", () => {
      if (this.keyPrefix) console.log(`valkey client with prefix ${this.keyPrefix} connected`);
      else console.log(`valkey client connected`);
      this.connected = true;
    });
    this.client.on("disconnect", () => {
      console.log("valkey client disconnected");
      this.connected = false;
    });

    this.client.on("error", (error) => {
      console.error(error);
    });
  }

  async connect() {
    await this.client.connect();
    const connectionAttemptStartedAt = Date.now();
    while (!this.connected) {
      const currentTime = Date.now();
      const elapsed = currentTime - connectionAttemptStartedAt;
      if (elapsed > CONNECTION_TIMEOUT_MS) {
        this.client.disconnect();
        return console.error("connection to valkey timed out");
      }
      continue;
    }
  }
  async disconnect() {
    await this.client.disconnect();
    if (!this.keyPrefix)
      console.log(
        `redis client with ${
          this.keyPrefix ? `context ${this.keyPrefix}` : "vanilla context"
        } disconnected`
      );
  }

  async set(key: string, value: any, options?: SetOptions | undefined) {
    return await this.client.set(this.keyPrefix + key, value, options);
  }
  async get(key: string) {
    return this.client.get(this.keyPrefix + key);
  }
  async del(key: string) {
    return await this.client.del(this.keyPrefix + key);
  }
  async expire(key: string, seconds: number, mode?: "NX" | "XX" | "GT" | "LT") {
    return this.client.expire(this.keyPrefix + key, seconds, mode);
  }
  async incrBy(key: string, increment: number) {
    return this.client.incrBy(this.keyPrefix + key, increment);
  }
  async hIncrBy(key: string, field: string, increment: number) {
    return this.client.hIncrBy(this.keyPrefix + key, field, increment);
  }
  async hGetAll(key: string) {
    return this.client.hGetAll(this.keyPrefix + key);
  }
  async hDel(key: string, fields: string | string[]) {
    return await this.client.hDel(this.keyPrefix + key, fields);
  }
  async zAdd(key: string, entries: { value: string; score: number }[]) {
    return await this.client.zAdd(this.keyPrefix + key, entries);
  }
  async zRem(key: string, members: string[]) {
    return await this.client.zRem(this.keyPrefix + key, members);
  }
  async zRangeWithScores(key: string, min: number, max: number, options: {}) {
    return this.client.zRangeWithScores(this.keyPrefix + key, min, max, options);
  }
  async zRevRank(key: string, member: string) {
    return this.client.zRevRank(this.keyPrefix + key, member);
  }
  async zRank(key: string, member: string) {
    return this.client.zRank(this.keyPrefix + key, member);
  }
  async zCard(key: string) {
    return this.client.zCard(this.keyPrefix + key);
  }
  async getKeysByPrefix() {
    let currentCursor: number | undefined;
    let keysToReturn: string[] = [];
    while (currentCursor !== 0) {
      // eslint-disable-next-line no-await-in-loop
      const { cursor, keys } = await this.client.scan(currentCursor || 0, {
        MATCH: `${this.keyPrefix}*`,
        COUNT: 10,
      });
      keysToReturn = [...keysToReturn, ...keys];
      currentCursor = cursor;
    }
    return keysToReturn;
  }
  async unlink(keys: string[]) {
    if (keys.length) return this.client.unlink(keys);
  }
  async removeAllKeys() {
    const keysToRemove = await this.getKeysByPrefix();
    const numKeysRemoved = await this.unlink(keysToRemove);
    return [numKeysRemoved, keysToRemove];
  }
  async cleanup() {
    const removed = await this.removeAllKeys();
    await this.disconnect();
    return removed;
  }
}

export const valkeyManager = { context: new ValkeyManager("") };
