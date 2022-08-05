import { WebSocketServer, SurpassSocket } from '../socket';

/**global变量 */
declare global {
    namespace NodeJS {
        interface Global {
            ServiceLimit: number;
            SocketServer: WebSocketServer;
            SingleServiceSocket: SurpassSocket | undefined;
            ServiceSocketMap: Record<string, SurpassSocket>;
            ClientServices: Set<SurpassSocket>;
            Exception: ExceptionConstructor;
        }
    }
}
