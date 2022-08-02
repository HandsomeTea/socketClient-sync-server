import WebSocket from 'ws';
import http from 'http';

export type SurpassSocket = WebSocket & {
    from: SocketType
    /** service连接专有属性 */
    serviceId: string
    /** client连接专有属性 */
    isLogin: boolean
    /** client连接专有属性 */
    messageTimerRecord: Record<string, NodeJS.Timeout>;
    transfer: (arg: EquipmentMessage | PortalMessage | SystemMessage, from: 'system' | 'client' | 'service') => void
}

export class WebSocketServer extends WebSocket.Server {
    constructor(_options?: WebSocket.ServerOptions, _callback?: () => void) {
        super(_options, _callback);
    }

    connection(cb: (socket: SurpassSocket, request: http.IncomingMessage) => void): void {
        this.on('connection', cb);
    }

    get wsClients(): Set<SurpassSocket> {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return this.clients;
    }
}
