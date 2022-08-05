import WebSocket from 'ws';
import http from 'http';

export interface ServiceWebSocketAttempt {
    connection: {
        id: string
        ip: string
    }
    from: 'service'
    serviceId?: string
    serviceName?: string
}

export interface ClientWebSocketAttempt {
    connection: {
        id: string
        ip: string
    }
    from: 'client'
    messageTimerRecord: Record<string, NodeJS.Timeout>
}

export type TransferType = 'system => client'
    | 'system => service'
    | `system => service[${string}:${string}]`
    | 'client => service'
    | `client => service[${string}:${string}]`
    | 'service => client'
    | `service[${string}:${string}] => client`

export type SurpassSocket = WebSocket & {
    attempt: ServiceWebSocketAttempt | ClientWebSocketAttempt
    transfer: (arg: EquipmentMessage | PortalMessage | SystemMessage, from: TransferType) => void
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
