import { GameWorld } from ".";

export default function processMessagesFromNext(this: GameWorld) {
  while (this.messages.length > 0) {
    const message = this.messages.pop();
    if (message !== undefined) {
      const maybeError = this.handleMessageFromNext(message);
      if (maybeError instanceof Error) {
        console.error(maybeError.message);
        this.engine.stopRenderLoop();
      }
    }
  }
}
