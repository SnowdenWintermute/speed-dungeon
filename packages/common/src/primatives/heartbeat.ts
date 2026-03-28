import { Milliseconds } from "../aliases.js";

export class HeartbeatTask {
  public lastRunMs: Milliseconds = 0;

  constructor(
    public readonly intervalMs: Milliseconds,
    public readonly run: () => void | Promise<void>
  ) {}
}

export class HeartbeatScheduler {
  private interval: NodeJS.Timeout | null = null;
  private readonly tasks = new Set<HeartbeatTask>();

  constructor(private readonly tickMs: Milliseconds) {}

  register(task: HeartbeatTask): void {
    this.tasks.add(task);
  }

  unregister(task: HeartbeatTask): void {
    this.tasks.delete(task);
  }

  start(): void {
    if (this.interval !== null) {
      return;
    }

    this.interval = setInterval(() => {
      void this.tick();
    }, this.tickMs);
  }

  private async tick(): Promise<void> {
    const now = Date.now() as Milliseconds;

    for (const task of this.tasks) {
      if (now - task.lastRunMs >= task.intervalMs) {
        task.lastRunMs = now;
        try {
          await task.run();
        } catch (error) {
          console.error("error in heartbeat:", error);
        }
      }
    }
  }

  stop(): void {
    if (this.interval !== null) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}
