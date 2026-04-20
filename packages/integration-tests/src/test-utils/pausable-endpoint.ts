import { ConnectionEndpoint } from "@speed-dungeon/common";

type MessageListener = (data: string | ArrayBuffer) => void;

export type PausableEndpoint = ConnectionEndpoint & {
  pause(): void;
  resume(): void;
};

export function wrapAsPausable(inner: ConnectionEndpoint): PausableEndpoint {
  const messageListeners = new Set<MessageListener>();
  const buffered: (string | ArrayBuffer)[] = [];
  let paused = false;

  const dispatch = (data: string | ArrayBuffer) => {
    for (const listener of [...messageListeners]) listener(data);
  };

  inner.on("message", (data) => {
    if (paused) buffered.push(data);
    else dispatch(data);
  });

  return new Proxy(inner, {
    get(target, prop, receiver) {
      if (prop === "pause") {
        return () => {
          paused = true;
        };
      }
      if (prop === "resume") {
        return () => {
          paused = false;
          const pending = buffered.splice(0);
          for (const d of pending) dispatch(d);
        };
      }
      if (prop === "on") {
        return (event: string, listener: (...args: any[]) => void) => {
          if (event === "message") messageListeners.add(listener as MessageListener);
          else target.on(event as never, listener as never);
          return receiver;
        };
      }
      if (prop === "once") {
        return (event: string, listener: (...args: any[]) => void) => {
          if (event === "message") {
            const wrapper: MessageListener = (d) => {
              messageListeners.delete(wrapper);
              (listener as MessageListener)(d);
            };
            messageListeners.add(wrapper);
          } else target.once(event as never, listener as never);
          return receiver;
        };
      }
      if (prop === "off") {
        return (event: string, listener: (...args: any[]) => void) => {
          if (event === "message") messageListeners.delete(listener as MessageListener);
          else target.off(event, listener);
          return receiver;
        };
      }
      const value = Reflect.get(target, prop, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
  }) as PausableEndpoint;
}
