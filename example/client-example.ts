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
    service?: string
    method: string
    data: any
    errorCode?: string
    message?: string
}

class WebSocketClient {
    private service!: WS;
    private sendIds: Set<string>;

    constructor() {
        this.sendIds = new Set();
    }

    private async init(): Promise<true> {
        this.service = new WS('ws://localhost:3207/sync/server', { headers: { 'websocket-accept-sign': 'client' } });
        this.service.removeAllListeners('message').on('message', result => {
            try {
                const { id, type, service, method, data, errorCode, message } = JSON.parse(result.toString() as unknown as string) as ResponseWsMessage;

                if (id) {
                    this.service.emit('all', {
                        id, type, method,
                        ...typeof data !== 'undefined' ? { data } : {},
                        ...typeof errorCode !== 'undefined' ? { errorCode } : {},
                        ...typeof message !== 'undefined' ? { message } : {}
                    });
                } else {
                    this.service.emit(method, {
                        type, method,
                        ...typeof service !== 'undefined' ? { service } : {},
                        ...typeof data !== 'undefined' ? { data } : {}
                    });
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

    private get id() {
        return `${Date.now() + Math.floor(Math.random() * 1001)}`;
    }

    private async syncSend(type: 'request' | 'order', method: string, data: any, service?: string): Promise<any> {
        if (!this.isOK) {
            return null;
        }
        const id = this.id;

        this.sendIds.add(id);
        this.service.send(JSON.stringify({ id, ...service ? { service } : {}, type, method, data }));

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

    async request(method: string, params: any, service?: string) {
        return await this.syncSend('request', method, params, service);
    }

    async order(command: string, params: any, service?: string) {
        return await this.syncSend('order', command, params, service);
    }

    async listen(method: string, clear = true): Promise<any> {
        return new Promise(resolve => {
            (clear ? this.service.removeAllListeners(method) : this.service).on(method, res => {
                resolve(res);
            });
        });
    }
}

// export default new WebSocketClient();

const webWs = new WebSocketClient();

webWs.connect().then(async () => {
    // webWs.request('login', ['sadasdasdsss'])
    // webWs.request('login', ['sadasdasdsss'])
    // webWs.request('login', ['sadasdasdsss'])
    await webWs.request('login', ['sadasdasd']).then(aa0 => {
        // eslint-disable-next-line no-console
        console.log(0, aa0);
    }).catch(e => {
        // eslint-disable-next-line no-console
        console.log(0, e);
    });

    // const aa1 = await webWs.request('login', ['sadasdasd']);

    // console.log(1, aa1);

    // setTimeout(async () => {
    //     const aa2 = await webWs.request('login', ['sadasdasd']);

    //     console.log(11, aa2);
    // }, 2000)
    // const aa3 = await webWs.listen('login');

    // console.log(111, aa3);

    // webWs.listen('test').then(res => {
    //     // eslint-disable-next-line no-console
    //     console.log(1111, res);
    // });
});
