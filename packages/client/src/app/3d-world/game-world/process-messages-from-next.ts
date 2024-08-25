import { GameWorld } from ".";

export default function processMessagesFromNext(this: GameWorld) {
  if (this.messages.length > 0) {
    const message = this.messages.shift();
    if (message !== undefined) {
      const maybeError = this.handleMessageFromNext(message);
      if (maybeError instanceof Error) {
        console.error(maybeError.message);
        this.engine.stopRenderLoop();
      }
    }
  }
}
