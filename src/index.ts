import { Server } from 'http';

import { getENV, log, messageError } from '@/configs';
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

        if (sign === 'service') {
            // service-client一对多的情况
            if (getENV('SERVICE_MODE') === 'single') {
                if (global.ServiceCount > 0) {
                    socket.send(JSON.stringify({
                        type: 'system',
                        method: 'connect',
                        errorCode: messageError.EQUIPMENT_OUT_OF_LIMIT,
                        message: 'there can only be one service connection'
                    } as SystemMessage));
                    socket.close();
                    return;
                }
            } else { // service-client多对多的情况
                if (global.ServiceCount === global.ServiceLimit) {
                    socket.send(JSON.stringify({
                        type: 'system',
                        method: 'connect',
                        errorCode: messageError.EQUIPMENT_OUT_OF_LIMIT,
                        message: 'the service connection has reached the maximum limit'
                    } as SystemMessage));
                    socket.close();
                    return;
                }
            }
        }

        socket.from = sign;

        if (sign === 'service' && getENV('SERVICE_MODE') === 'multi') {
            const serviceId = req.headers['websocket-accept-sign-id']?.toString() as undefined | string;

            if (!serviceId) {
                socket.send(JSON.stringify({
                    type: 'system',
                    method: 'connect',
                    errorCode: messageError.CONNECT_NO_PERMISSION,
                    message: 'the service connection must have sign-id'
                } as SystemMessage));
                socket.close();
                return;
            }
            socket.serviceId = serviceId;
        }
        socket.transfer = (arg: PortalMessage | EquipmentMessage | SystemMessage, from: 'system' | 'client' | 'service') => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            if (arg.errorCode) {
                log(`${from}-send`).error(JSON.stringify(arg, null, '   '));
            } else {
                log(`${from}-send`).info(JSON.stringify(arg, null, '   '));
            }
            socket.send(JSON.stringify(arg));
        };

        if (socket.from === 'client') {
            global.ClientCount++;
        }
        if (socket.from === 'service') {
            global.ServiceCount++;
        }

        log('connection').debug(`${socket.from} connect success, ip: ${req.socket.remoteAddress}. service count is ${global.ServiceCount}. client count is ${global.ClientCount}.`);

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
