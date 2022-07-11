import { WebSocketServer } from '../socket';

/**global变量 */
declare global {
    namespace NodeJS {
        interface Global {
            ServiceLimit: number;
            ServiceCount: number;
            ClientCount: number;
            SocketServer: WebSocketServer;
            Exception: ExceptionConstructor;
        }
    }
}
