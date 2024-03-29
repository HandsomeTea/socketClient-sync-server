/* eslint-disable no-console */
import { ResponseObserveMessage, ServerWebSocket } from './server-example';


const server = new ServerWebSocket('ws://localhost:3207/sync/server');

server.connect().then(async () => {
    server.observe('connect', res => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (res.data === 'connected') {
            console.log('server connected!');
            server.observe('login', res => {
                const login = { ...res } as ResponseObserveMessage;

                if (login.payload.username === 'test' && login.payload.password === '123') {
                    login.response({
                        data: {
                            userId: 'test123',
                            resume: 'xxxxxxx'
                        }
                    });
                } else if (login.payload.username === 'me') {
                    login.response({
                        errorCode: 'FORBIDDEN',
                        message: 'login failed!'
                    });
                }
            });

            setTimeout(() => {
                server.notice({
                    name: 'update-service',
                    params: {
                        time: new Date()
                    }
                });
            }, 7000);

            server.observe('communicationLinkCount', data => {
                console.log(data);
            });
        } else {
            console.log(res);
        }
    });
});
