/* eslint-disable @typescript-eslint/no-explicit-any */
import WS from 'ws';

export interface ResponseObserveMessage {
    payload: any
    response: (params: { data: any } | { errorCode: string, message: string }) => void
}

export class ServerWebSocket {
    private service!: WS;
    private serviceId!: string;
    private serviceName!: string;

    constructor(option?: { id: string, name: string }) {
        if (option) {
            this.serviceId = option.id;
            this.serviceName = option.name;
        }
    }

    private async init(): Promise<true> {
        this.service = new WS('ws://localhost:3207/sync/server', {
            headers: {
                'websocket-accept-sign': 'service',
                ...this.serviceId ? { 'websocket-accept-sign-id': this.serviceId } : {},
                ...this.serviceName ? { 'websocket-accept-sign-name': this.serviceName } : {}
            }
        });
        this.service.removeAllListeners('message').on('message', result => {
            try {
                const msg = JSON.parse(result.toString() as unknown as string) as {
                    id: string,
                    type: 'request' | 'system',
                    method: string,
                    data: any,
                    errorCode?: string
                    message?: string
                };
                const { id, type, method, data } = msg;

                if (type === 'request') {
                    this.service.emit(method, {
                        ...data ? { payload: data } : {},
                        response: (params: { data: any } | { errorCode: string, message: string }) => {
                            this.service.send(JSON.stringify({
                                id,
                                type: 'response',
                                method,
                                ...params
                            }));
                        }
                    } as ResponseObserveMessage);
                } else {
                    this.service.emit(method, msg);
                }
            } catch (e) {
                //
            }
        });

        return new Promise((resolve, reject) => {
            this.service.on('open', () => {
                resolve(true);
            });
            this.service.on('error', e => {
                reject(e);
            });
        });
    }

    async connect() {
        if (this.isOK) {
            return true;
        }
        return await this.init();
    }

    close() {
        if (this.isOK) {
            this.service.close();
        }
    }

    get isOK() {
        return this.service?.readyState === 1;
    }

    notice(arg: { name: string, params: any }) {
        if (this.isOK) {
            this.service.send(JSON.stringify({
                ...this.serviceId ? { service: this.serviceId } : {},
                type: 'notice',
                method: arg.name,
                data: arg.params
            }));
        }
    }

    observe(method: string, cb: (arg: ResponseObserveMessage | SystemMessage) => void) {
        this.service.on(method, cb);
    }
}
