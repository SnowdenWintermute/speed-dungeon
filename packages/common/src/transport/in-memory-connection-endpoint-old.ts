// import { ConnectionId, UntypedEndpointBrand } from "../aliases.js";
// import { UntypedConnectionEndpoint } from "./connection-endpoint.js";
// import { TransportDisconnectReason, TransportDisconnectReasonType } from "./disconnect-reasons.js";

// export class UntypedInMemoryConnectionEndpoint extends UntypedConnectionEndpoint {
//   private subscribeAllHandler: ((message: unknown) => void) | null = null;
//   private disconnectHandler: ((reason: TransportDisconnectReason) => Promise<void>) | null = null;
//   private alreadyClosed = false;

//   readonly [UntypedEndpointBrand] = true;

//   constructor(
//     public readonly id: ConnectionId,
//     /**
//       ask the transport to deliver this message as someone’s inbound. Basically they will
//       call receive on their paired endpoint, but they don't know that explicitly. Analogous to socket.emit
//     * */
//     private readonly deliverInbound: (message: unknown) => void,
//     private readonly onClose: () => Promise<void>
//   ) {
//     super();
//   }

//   // analogous to socket.emit
//   send(message: unknown): void {
//     this.deliverInbound(message);
//   }

//   // analogous to socket.on("someEventWeAgreeOn", (data)=>void)
//   subscribeAll(
//     handler: (message: unknown) => void,
//     disconnectHandler: (reason: TransportDisconnectReason) => Promise<void>
//   ): void {
//     this.subscribeAllHandler = handler;
//     this.disconnectHandler = disconnectHandler;
//   }

//   // analogous to having the "someEventWeAgreeOn" subscribed event fire
//   receive(message: unknown): void {
//     this.subscribeAllHandler?.(message);
//   }

//   async close(): Promise<void> {
//     if (this.alreadyClosed) {
//       return;
//     }

//     this.alreadyClosed = true;

//     if (this.disconnectHandler === null) {
//       // In memory endpoint closed without a disconnect handler
//     } else {
//       await this.disconnectHandler(
//         new TransportDisconnectReason(TransportDisconnectReasonType.TransportClose)
//       );
//     }
//     await this.onClose();
//   }
// }
