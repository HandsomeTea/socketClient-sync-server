/* eslint-disable no-console */
import { ServerWebSocket } from './server-example';

const server1 = new ServerWebSocket({ id: 'server-123', name: 'server1' });
const server2 = new ServerWebSocket({ id: 'server-456', name: 'server2' });
const server3 = new ServerWebSocket({ id: 'server-789', name: 'server3' });


server1.connect().then(async () => {
    await server2.connect();
    await server3.connect();
});
