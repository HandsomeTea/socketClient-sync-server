/* eslint-disable no-console */
import { ResponseObserveMessage, ServerWebSocket } from './server-example';

const address = 'ws://localhost:3207/sync/server';
const server1 = new ServerWebSocket(address, { id: 'server-123', name: 'server1' });
const server2 = new ServerWebSocket(address, { id: 'server-456', name: 'server2' });
const server3 = new ServerWebSocket(address, { id: 'server-789', name: 'server3' });


server1.connect().then(() => {
    server1.observe('connect', res1 => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (res1.data === 'connected') {

            setTimeout(() => {
                server1.notice({
                    name: 'nothing',
                    params: {
                        test: 'nnn'
                    }
                });
            }, 12000);

            server1.observe('login', res => {
                const login = { ...res } as ResponseObserveMessage;

                if (login.payload.username === 'test' && login.payload.password === '123') {
                    login.response({
                        data: {
                            userId: 'test123',
                            resume: 'xxxxxxx'
                        }
                    });
                }
            });


            console.log('server1 connected!');
            server2.connect().then(() => {
                server2.observe('connect', res2 => {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    if (res2.data === 'connected') {


                        server2.observe('login', res => {
                            const login = { ...res } as ResponseObserveMessage;

                            if (login.payload.username === 'me') {
                                login.response({
                                    errorCode: 'FORBIDDEN',
                                    message: 'login failed!'
                                });
                            }
                        });

                        console.log('server2 connected!');
                        server3.connect().then(() => {
                            server3.observe('connect', res3 => {
                                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                // @ts-ignore
                                if (res3.data === 'connected') {
                                    console.log('server3 connected!');
                                } else {
                                    console.log('res3', res3);
                                }
                            });
                        });
                    } else {
                        console.log('res2', res2);
                    }
                });
            });
        } else {
            console.log('res1', res1);
        }
    });
}).catch(e => console.log(e));
