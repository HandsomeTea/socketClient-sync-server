import { WebSocketServer, SurpassSocket } from '../socket';

/**global变量 */
declare global {
    namespace NodeJS {
        interface Global {
            ServiceLimit: number;
            ServiceCount: number;
            ClientCount: number;
            SocketServer: WebSocketServer;
            SingleServiceSocket: SurpassSocket;
            ServiceSocketMap: Record<string, SurpassSocket>;
            ClientServices: Set<SurpassSocket>;
            Exception: ExceptionConstructor;
        }
    }
}
