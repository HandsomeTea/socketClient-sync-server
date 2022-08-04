/* eslint-disable no-console */
import { ResponseObserveMessage, ServerWebSocket as Server } from './server-example';


const server = new Server();
// const server1 = new Server({ id: 'server-123', name: 'server1' });
// const server2 = new Server({ id: 'server-456', name: 'server2' });

server.connect().then(async () => {
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
});
