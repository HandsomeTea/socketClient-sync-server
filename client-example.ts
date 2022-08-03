/* eslint-disable @typescript-eslint/no-explicit-any */
import WS from 'ws';

process.on('unhandledRejection', reason => {
    // eslint-disable-next-line no-console
    console.error('error', reason);
});

process.on('uncaughtException', reason => {
    // eslint-disable-next-line no-console
    console.error('error', reason);
});

interface ResponseWsMessage {
    id?: string
    type: 'system' | 'notice' | 'order-result' | 'response'
    method: string
    data: any
    errorCode?: string
    message?: string
}

class WebSocket {
    private service!: WS;
    private sendIds: Set<string>;

    constructor() {
        this.sendIds = new Set();
    }

    private async init(): Promise<true> {
        this.service = new WS('ws://localhost:3207/sync/server', { headers: { 'websocket-accept-sign': 'client' } });
        this.service.removeAllListeners('message').on('message', result => {
            try {
                const { id, type, method, data, errorCode, message } = JSON.parse(result.toString() as unknown as string) as ResponseWsMessage;

                if (id) {
                    this.service.emit('all', { id, type, method, data, errorCode, message });
                } else {
                    this.service.emit(method, data);
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
        return await this.init();
    }

    close() {
        this.service.close();
    }

    get isOK() {
        return this.service.readyState === 1;
    }

    private get id() {
        return `${Date.now() + Math.floor(Math.random() * 1001)}`;
    }

    private async syncSend(type: 'request' | 'order', method: string, data: any): Promise<any> {
        const id = this.id;

        this.sendIds.add(id);
        this.service.send(JSON.stringify({ id, type, method, data }));

        return new Promise((resolve, reject) => {
            (this.sendIds.size === 1 ? this.service.removeAllListeners('all') : this.service).on('all', (res: ResponseWsMessage) => {
                if (res.id === id) {
                    const { data, errorCode, message } = res;

                    if (data) {
                        resolve(data);
                    } else {
                        reject({ errorCode, message });
                    }
                    this.sendIds.delete(id);
                }
            });
        });
    }

    async request(method: string, params: any) {
        return await this.syncSend('request', method, params);
    }

    async order(command: string, params: any) {
        return await this.syncSend('order', command, params);
    }

    async listen(method: string, clear = true): Promise<any> {
        return new Promise(resolve => {
            (clear ? this.service.removeAllListeners(method) : this.service).on(method, res => {
                resolve(res);
            });
        });
    }
}

// export default new WebSocket();

const webWs = new WebSocket();

webWs.connect().then(async () => {
    // webWs.request('login', ['sadasdasdsss'])
    // webWs.request('login', ['sadasdasdsss'])
    // webWs.request('login', ['sadasdasdsss'])

    // const aa1 = await webWs.request('login', ['sadasdasd']);

    // console.log(1, aa1);

    // setTimeout(async () => {
    //     const aa2 = await webWs.request('login', ['sadasdasd']);

    //     console.log(11, aa2);
    // }, 2000)
    // const aa3 = await webWs.listen('login');

    // console.log(111, aa3);
});
