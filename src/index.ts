import { Server } from 'http';
import crypto from 'crypto';

import { getENV, log, messageError } from '@/configs';
import clientMsgDeal from '@/client';
import serviceMsgDeal from '@/server';
import { TransferType, WebSocketServer } from '../socket';

export default (server: Server): void => {
    global.SocketServer = new WebSocketServer({ path: '/sync/server', server, maxPayload: 0 });

    global.SocketServer.connection((socket, request) => {
        const sign = request.headers['websocket-accept-sign']?.toString() as undefined | SocketType;

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

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        socket.attempt = {};
        socket.attempt.from = sign;
        socket.attempt.connection = {
            id: crypto.randomBytes(24).toString('hex').substring(0, 16),
            ip: request.connection.remoteAddress || ''
        };

        if (socket.attempt.from === 'service' && getENV('SERVICE_MODE') === 'multi') {
            const serviceId = request.headers['websocket-accept-sign-id']?.toString() as undefined | string;
            const serviceName = request.headers['websocket-accept-sign-name']?.toString() as undefined | string;

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
            socket.attempt.serviceId = serviceId;
            socket.attempt.serviceName = serviceName || '';
        }

        if (socket.attempt.from === 'client') {
            socket.attempt.messageTimerRecord = {};
            global.ClientCount++;
        } else {
            global.ServiceCount++;
        }

        socket.transfer = (arg: PortalMessage | EquipmentMessage | SystemMessage, mark: TransferType) => {
            const serviceMrak = getENV('SERVICE_MODE') === 'multi' ? `[${mark.serviceId}:${mark.serviceName}]` : '';
            let from = '';

            from += mark.from === 'service' ? `service${serviceMrak}` : mark.from;
            from += ' => ';
            from += mark.to === 'service' ? `service${serviceMrak}` : 'client';

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            if (arg.errorCode) {
                log(from).error(JSON.stringify(arg, null, '   '));
            } else {
                log(from).info(JSON.stringify(arg, null, '   '));
            }
            socket.send(JSON.stringify(arg));
        };
        // ======================================连接处理结束==========================================================================

        log('connection').debug(`${socket.attempt.from} connect success, ip: ${socket.attempt.connection.ip}. service count is ${global.ServiceCount}. client count is ${global.ClientCount}.`);

        // 通知除了当前连接之外的其他连接：有新的连接上线
        [
            ...global.ClientServices,
            ...Object.values(global.ServiceSocketMap || {}),
            ...global.SingleServiceSocket ? [global.SingleServiceSocket] : []
        ].map(a => {
            if (socket.attempt.from === 'client' && a.attempt.from === 'service') {
                a.transfer({
                    type: 'system',
                    method: 'communicationLinkCount',
                    data: global.ClientCount
                } as SystemMessage, { from: 'system', to: 'service', serviceId: a.attempt.serviceId, serviceName: a.attempt.serviceName });
            } else if (socket.attempt.from === 'service' && a.attempt.from === 'client') {
                a.transfer({
                    type: 'system',
                    method: 'communicationLinkCount',
                    data: global.ServiceCount
                } as SystemMessage, { from: 'system', to: 'client' });
            }
        });

        if (socket.attempt.from === 'client') {
            global.ClientServices.add(socket);
        } else {
            if (getENV('SERVICE_MODE') === 'single') {
                global.SingleServiceSocket = socket;
            } else {
                if (!global.ServiceSocketMap) {
                    global.ServiceSocketMap = {};
                }
                global.ServiceSocketMap[socket.attempt.serviceId as string] = socket;
            }
        }

        socket.transfer({
            type: 'system',
            method: 'connect',
            data: 'connected'
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
        } as SystemMessage, { from: 'system', to: socket.attempt.from, serviceId: socket.attempt.serviceId, serviceName: socket.attempt.serviceName });


        socket.on('ping', ping => {
            // 不需要回pong，ws自动回复
            log('ping-message').debug(ping.toString());
        });

        socket.on('message', params => {
            try {
                const data = JSON.parse(params.toString());

                if (socket.attempt.from === 'client') {
                    return clientMsgDeal(socket, data);
                } else {
                    return serviceMsgDeal(socket, data);
                }
            } catch (e) {
                log(`receive-from-${socket.attempt.from}`).error('unknown message:');
                log(`receive-from-${socket.attempt.from}`).error(params.toString());
                return;
            }
        });

        socket.on('close', () => {
            if (socket.attempt.from === 'client') {
                global.ClientCount--;
            }
            if (socket.attempt.from === 'service') {
                global.ServiceCount--;
            }
            log('socket-closed').debug(`a ${socket.attempt.from} is offline. service count is ${global.ServiceCount}. client count is ${global.ClientCount}.`);

            if (socket.attempt.from === 'client') {
                global.ClientServices.delete(socket);
            } else {
                if (getENV('SERVICE_MODE') === 'single') {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    delete global.SingleServiceSocket;
                } else {
                    delete global.ServiceSocketMap[socket.attempt.serviceId as string];
                }
            }
        });
    });
};
