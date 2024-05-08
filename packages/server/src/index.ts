import createExpressApp from "./createExpressApp";
import SocketIO from "socket.io";

const PORT = 8080;

const expressApp = createExpressApp();
const listening = expressApp.listen(PORT, async () => {
  const io = new SocketIO.Server(listening);
  console.log(`express server on port ${PORT}`);
  io.on("test", () => console.log("got test msg"));
});
