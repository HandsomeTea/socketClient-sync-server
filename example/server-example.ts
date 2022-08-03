/* eslint-disable @typescript-eslint/no-explicit-any */
import WS from 'ws';

class WebSocketServer {
    private service!: WS;

    constructor() {
        //
    }

    private async init(): Promise<true> {
        this.service = new WS('ws://localhost:3207/sync/server', { headers: { 'websocket-accept-sign': 'service' } });
        this.service.removeAllListeners('message').on('message', result => {
            try {
                const { id, type, method, data } = JSON.parse(result.toString() as unknown as string) as { id: string, type: 'request' | 'order', method: string, data: any };

                this.service.emit(method, {
                    ...data ? { payload: data } : {},
                    response: (params: { data: any } | { errorCode: string, message: string }) => {
                        this.service.send(JSON.stringify({
                            id,
                            type: type === 'order' ? 'order-result' : 'response',
                            method,
                            ...params
                        }));
                    }
                });
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

    notice(arg: { service?: string, name: string, params: any }) {
        if (this.isOK) {
            this.service.send(JSON.stringify({
                service: arg.service,
                type: 'notice',
                method: arg.name,
                data: arg.params
            }));
        }
    }

    async observe(method: string): Promise<{ payload: any, response: (params: { data: any } | { errorCode: string, message: string }) => void }> {
        return new Promise(resolve => {
            this.service.on(method, res => {
                resolve(res);
            });
        });
    }
}

// export default new WebSocketServer();

const webWs = new WebSocketServer();

webWs.connect().then(async () => {
    webWs.observe('login').then(res => {
        // eslint-disable-next-line no-console
        console.log(res.payload);

        res.response({ data: 'success' });
        // res.response({ errorCode: 'NO_PERMISSION', message: 'error!' });
    });
});
