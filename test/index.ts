import { describe, it, before } from 'mocha';
import assert from 'assert';

import Server from './server.test';
import Client from './client.test';

// server.connect().then(async () => {
//     server.notice({ name: 'test', params: [{ a: 123 }] });
//     server.observe('login').then(res => {
//         // eslint-disable-next-line no-console
//         console.log(res.payload);

//         res.response({ data: 'success' });
//         // res.response({ errorCode: 'NO_PERMISSION', message: 'error!' });
//     });
// });


// client.connect().then(async () => {
//     // client.request('login', ['sadasdasdsss'])
//     // client.request('login', ['sadasdasdsss'])
//     // client.request('login', ['sadasdasdsss'])
//     await client.request('login', ['sadasdasd']).then(aa0 => {
//         // eslint-disable-next-line no-console
//         console.log(0, aa0);
//     }).catch(e => {
//         // eslint-disable-next-line no-console
//         console.log(0, e);
//     });

//     // const aa1 = await client.request('login', ['sadasdasd']);

//     // console.log(1, aa1);

//     // setTimeout(async () => {
//     //     const aa2 = await client.request('login', ['sadasdasd']);

//     //     console.log(11, aa2);
//     // }, 2000)
//     // const aa3 = await client.observe('login');

//     // console.log(111, aa3);

//     // client.observe('test').then(res => {
//     //     // eslint-disable-next-line no-console
//     //     console.log(1111, res);
//     // });
// });

describe('single service test', () => {
    const server = new Server();
    const client1 = new Client();
    const client2 = new Client();

    before(async () => {
        await server.connect();
        await client1.connect();
        await client2.connect();
    });

    describe('request', () => {
        it('success', async () => {
            assert.strictEqual([1, 2, 3].indexOf(4), -1);
        });

        it('error', async () => {
            assert.strictEqual([1, 2, 3].indexOf(4), -1);
        });

        it('timeout', async () => {
            assert.strictEqual([1, 2, 3].indexOf(4), -1);
        });
    });

    describe('order', () => {
        it('success', async () => {
            assert.strictEqual([1, 2, 3].indexOf(4), -1);
        });

        it('error', async () => {
            assert.strictEqual([1, 2, 3].indexOf(4), -1);
        });

        it('timeout', async () => {
            assert.strictEqual([1, 2, 3].indexOf(4), -1);
        });
    });

    describe('client observe', () => {
        it('observe', async () => {
            assert.strictEqual([1, 2, 3].indexOf(4), -1);
        });
    });

    describe('server notice', () => {
        it('should return -1 when the value is not present', async () => {
            assert.strictEqual([1, 2, 3].indexOf(4), -1);
        });
    });
});

describe('multi service test', () => {
    const server1 = new Server({ id: 'server-123', name: 'server1' });
    const server2 = new Server({ id: 'server-456', name: 'server2' });
    const client1 = new Client();
    const client2 = new Client();

    before(async () => {
        await server1.connect();
        await server2.connect();
        await client1.connect();
        await client2.connect();
    });
});
