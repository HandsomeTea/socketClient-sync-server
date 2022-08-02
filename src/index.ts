import { Server } from 'http';

import { log, messageError } from '@/configs';
import clientMsgDeal from '@/client';
import serviceMsgDeal from '@/server';
import { WebSocketServer } from '../socket';

export default (server: Server): void => {
    global.SocketServer = new WebSocketServer({ path: '/sync/server', server, maxPayload: 0 });
    global.SocketServer.connection((socket, req) => {
        socket.on('close', () => {
            if (socket.from === 'client') {
                global.ClientCount--;
            }
            if (socket.from === 'service') {
                global.ServiceCount--;
            }
            log('socket-closed').debug(`a ${socket.from} is offline. service count is ${global.ServiceCount}. client count is ${global.ClientCount}.`);
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

        if (sign === 'service' && global.ServiceCount > 0) {
            socket.send(JSON.stringify({
                type: 'system',
                method: 'connect',
                errorCode: messageError.EQUIPMENT_OUT_OF_LIMIT,
                message: 'there can only be one service connection'
            } as SystemMessage));
            socket.close();
            return;
        }

        socket.from = sign;
        socket.transfer = (arg: PortalMessage | EquipmentMessage | SystemMessage, from: 'system' | 'client' | 'service') => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            if (arg.errorCode) {
                log(`send-from-${from}`).error(JSON.stringify(arg, null, '   '));
            } else {
                log(`send-from-${from}`).info(JSON.stringify(arg, null, '   '));
            }
            socket.send(JSON.stringify(arg));
        };

        if (socket.from === 'client') {
            global.ClientCount++;
        }
        if (socket.from === 'service') {
            global.ServiceCount++;
        }

        log(`${socket.from}-connect`).info(`connect success, ip: ${req.socket.remoteAddress}. service count is ${global.ServiceCount}. client count is ${global.ClientCount}.`);

        socket.transfer({
            type: 'system',
            method: 'connect',
            data: 'connected'
        } as SystemMessage, 'system');

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
