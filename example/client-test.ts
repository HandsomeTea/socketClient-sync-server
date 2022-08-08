/* eslint-disable no-console */
import Client from './client-example';

const address = 'ws://localhost:3207/sync/server';
const client1 = new Client(address);
const client2 = new Client(address);
const client3 = new Client(address);

client1.connect().then(() => {
    client1.observe('connect', async res => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (res.data === 'connected') {
            await client2.connect();
            await client3.connect();
            console.log('client connected!');
            // const res1 = await client1.request('login', { username: 'test', password: '123' });

            // console.log(1, res1);

            // client1.request('login', { username: 'me', password: '123' }).catch(res2 => {
            //     console.log(2, res2);
            // });

            // client1.request('logins', {}).catch(res3 => {
            //     console.log(3, res3);
            // });

            // client1.observe('update-service', getNotice1 => {
            //     console.log(11, getNotice1);
            // });
            // client2.observe('update-service', getNotice2 => {
            //     console.log(22, getNotice2);
            // });
            // client1.observe('communicationLinkCount', getNotice3 => {
            //     console.log(33, getNotice3);
            // });
            // client2.observe('communicationLinkCount', getNotice4 => {
            //     console.log(44, getNotice4);
            // });

            // 多服务端
            const res4 = await client3.request('login', { username: 'test', password: '123' }, 'server-123');

            console.log(1, res4);

            client3.request('login', { username: 'me', password: '123' }, 'server-456').catch(res5 => {
                console.log(2, res5);
            });

            client3.request('logins', {}, 'server-789').catch(res6 => {
                console.log(3, res6);
            });

            client2.observe('nothing', getNotice5 => {
                console.log(55, getNotice5);
            });

            const res5 = await client2.request('serviceList', {});

            console.log(4, res5);
        } else {
            console.log(res);
        }
    });
}).catch(e => console.log(e));

// describe('single service test', () => {
//     before(async () => {
//         // await server.connect();

//     });

//     describe('#client-request', () => {
//         it('success response', async done => {


//             assert.strictEqual(result.userId, 'test123');
//             done();
//         });

//         // it('error response', async done => {
//         //     const result = await client1.request('login', { username: 'me', password: '123' });

//         //     assert.strictEqual(result.errorCode, messageError.FORBIDDEN);
//         //     done();
//         // });

//         // it('timeout response', async done => {
//         //     const result = await client1.request('login', {});

//         //     assert.strictEqual(result.errorCode, messageError.GATEWAY_TIMEOUT);
//         //     done();
//         // });
//     });

//     // describe('#client-order', () => {
//     //     it('success', async () => {
//     //         assert.strictEqual([1, 2, 3].indexOf(4), -1);
//     //     });

//     //     it('error', async () => {
//     //         assert.strictEqual([1, 2, 3].indexOf(4), -1);
//     //     });

//     //     it('timeout', async () => {
//     //         assert.strictEqual([1, 2, 3].indexOf(4), -1);
//     //     });
//     // });

//     // describe('#client-observe', () => {
//     //     it('observe', async () => {
//     //         assert.strictEqual([1, 2, 3].indexOf(4), -1);
//     //     });
//     // });

//     // describe('#server-notice', () => {
//     //     it('should return -1 when the value is not present', async () => {
//     //         assert.strictEqual([1, 2, 3].indexOf(4), -1);
//     //     });
//     // });
// });

// describe('multi service test', () => {
//     before(async () => {
//         await server1.connect();
//         await server2.connect();
//         await client1.connect();
//         await client2.connect();
//     });
// });
