import { Server } from 'http';

import { log, messageError } from '@/configs';
import clientMsgDeal from '@/client';
import serviceMsgDeal from '@/server';
import { WebSocketServer } from '../socket';

export default (server: Server): void => {
    global.SocketServer = new WebSocketServer({ path: '/sync/server', server, maxPayload: 0 });
    console.log(global.SocketServer.options.path);
    global.SocketServer.connection((socket, req) => {
        socket.on('close', () => {
            if (socket.from === 'client') {
                global.ClientCount--;
                log('socket-close').debug(`a client socket is offline. service count is ${global.ServiceCount}. client count is ${global.ClientCount}.`);
            }
            if (socket.from === 'service') {
                global.ServiceCount--;
                log('socket-close').debug(`a service socket is offline. service count is ${global.ServiceCount}. client count is ${global.ClientCount}.`);
            }
        });

        const sign = req.headers['websocket-accept-sign']?.toString() as undefined | SocketType;

        if (!(sign === 'client' || sign === 'service')) {
            socket.send(JSON.stringify({
                type: 'system',
                method: 'connect',
                errorCode: messageError.CONNECT_NO_PERMISSION,
                message: 'connection is neither the service side nor the client side!'
            } as SystemMessage));
            socket.close();
            return;
        }

        if (sign === 'service' && global.ServiceCount >= global.ServiceLimit) {
            log('socket').error(`the number of service is limited to ${global.ServiceLimit}. now is ${global.ServiceCount}`);
            socket.send(JSON.stringify({
                type: 'system',
                method: 'connect',
                errorCode: messageError.EQUIPMENT_OUT_OF_LIMIT,
                message: 'service connection is out of limit.'
            } as SystemMessage));
            socket.close();
            return;
        }

        socket.from = sign;

        if (socket.from === 'client') {
            global.ClientCount++;
        }
        if (socket.from === 'service') {
            global.ServiceCount++;
        }

        log(`${socket.from}-connect`).info(`connect success, ip: ${req.socket.remoteAddress}. service count is ${global.ServiceCount}. client count is ${global.ClientCount}.`);

        socket.send(JSON.stringify({
            type: 'system',
            method: 'connect',
            data: 'connected'
        } as SystemMessage));

        socket.isLogin = false;
        socket.messageTimerRecord = {};

        socket.on('ping', ping => {
            // 不需要回pong，ws自动回复
            log('ping-message').debug(ping.toString());
        });

        socket.on('message', params => {
            try {
                const data = JSON.parse(params.toString());

                if (socket.from === 'client') {
                    return clientMsgDeal(socket, data);
                } else {
                    return serviceMsgDeal(socket, data);
                }
            } catch (e) {
                log(`receive-from-${socket.from}`).error('unknown message:');
                log(`receive-from-${socket.from}`).error(params);
                return;
            }
        });
    });
};
