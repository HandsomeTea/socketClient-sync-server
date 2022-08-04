/* eslint-disable no-console */
import Client from './client-example';


const client1 = new Client();
const client2 = new Client();

client1.connect().then(async () => {
    await client2.connect();
    console.log('client1 connected!');
    const res1 = await client1.request('login', { username: 'test', password: '123' });

    console.log(1, res1);

    client1.request('login', { username: 'me', password: '123' }).catch(res2 => {
        console.log(2, res2);
    });

    client1.request('logins', {}).catch(res3 => {
        console.log(3, res3);
    });

    const getNotice1 = await client1.observe('update-service');
    const getNotice2 = await client2.observe('update-service');

    console.log(11, getNotice1);
    console.log(22, getNotice2);
});

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
