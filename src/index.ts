import { Server } from 'http';
import crypto from 'crypto';

import { getENV, log, messageError } from '@/configs';
import clientMsgDeal from '@/client';
import serviceMsgDeal from '@/server';
import { TransferType, WebSocketServer } from '../socket';
import { getServiceCount } from './lib';

const getMessageFrom = (mark: TransferType) => {
    const serviceMrak = getENV('SERVICE_MODE') === 'multi' ? `[${mark.serviceId}:${mark.serviceName}]` : '';
    let from = '';

    from += mark.from === 'service' ? `service${serviceMrak}` : mark.from;
    from += ' => ';
    from += mark.to === 'service' ? `service${serviceMrak}` : mark.to;

    return from;
};

export default (server: Server): void => {
    global.SocketServer = new WebSocketServer({ path: '/sync/server', server, maxPayload: 0 });

    global.SocketServer.connection((socket, request) => {
        const sign = request.headers['websocket-accept-sign']?.toString() as undefined | SocketType;
        const serviceId = request.headers['websocket-accept-sign-id']?.toString() as undefined | string;
        const serviceName = request.headers['websocket-accept-sign-name']?.toString() as undefined | string;

        if (!(sign === 'client' || sign === 'service')) {
            const message = {
                type: 'system',
                method: 'connect',
                errorCode: messageError.CONNECT_NO_PERMISSION,
                message: 'connection is neither the service side nor the client side!'
            } as SystemMessage;

            socket.send(JSON.stringify(message));
            socket.close();
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            log(getMessageFrom({ from: 'system', to: sign })).error(JSON.stringify(message, null, '   '));
            return;
        }

        if (sign === 'service') {
            // service-client一对多的情况
            if (getENV('SERVICE_MODE') === 'single') {
                if (global.SingleServiceSocket) {
                    const message = {
                        type: 'system',
                        method: 'connect',
                        errorCode: messageError.EQUIPMENT_OUT_OF_LIMIT,
                        message: 'there can only be one service connection'
                    } as SystemMessage;

                    socket.send(JSON.stringify(message));
                    socket.close();
                    log(getMessageFrom({ from: 'system', to: sign })).error(JSON.stringify(message, null, '   '));
                    return;
                }
            } else { // service-client多对多的情况
                if (Object.keys(global.ServiceSocketMap).length === global.ServiceLimit) {
                    const message = {
                        type: 'system',
                        method: 'connect',
                        errorCode: messageError.EQUIPMENT_OUT_OF_LIMIT,
                        message: 'the service connection has reached the maximum limit'
                    } as SystemMessage;

                    socket.send(JSON.stringify(message));
                    socket.close();
                    log(getMessageFrom({ from: 'system', to: sign, serviceId, serviceName })).error(JSON.stringify(message, null, '   '));
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
            if (!serviceId) {
                const message = {
                    type: 'system',
                    method: 'connect',
                    errorCode: messageError.CONNECT_NO_PERMISSION,
                    message: 'the service connection must have sign-id'
                } as SystemMessage;

                socket.send(JSON.stringify(message));
                socket.close();
                log(getMessageFrom({ from: 'system', to: sign, serviceId, serviceName })).error(JSON.stringify(message, null, '   '));
                return;
            }
            socket.attempt.serviceId = serviceId;
            socket.attempt.serviceName = serviceName || '';
        }

        if (socket.attempt.from === 'client') {
            socket.attempt.messageTimerRecord = {};
        }

        socket.transfer = (arg: PortalMessage | EquipmentMessage | SystemMessage, mark: TransferType) => {
            const from = getMessageFrom(mark);

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

        // 通知除了当前连接之外的其他连接：有新的连接上线
        [
            ...global.ClientServices,
            ...Object.values(global.ServiceSocketMap),
            ...global.SingleServiceSocket ? [global.SingleServiceSocket] : []
        ].map(a => {
            if (socket.attempt.from === 'client' && a.attempt.from === 'service') {
                a.transfer({
                    type: 'system',
                    method: 'communicationLinkCount',
                    data: global.ClientServices.size
                } as SystemMessage, { from: 'system', to: 'service', serviceId: a.attempt.serviceId, serviceName: a.attempt.serviceName });
            } else if (socket.attempt.from === 'service' && a.attempt.from === 'client') {
                a.transfer({
                    type: 'system',
                    method: 'communicationLinkCount',
                    data: getServiceCount()
                } as SystemMessage, { from: 'system', to: 'client' });
            }
        });

        if (socket.attempt.from === 'client') {
            global.ClientServices.add(socket);
        } else {
            if (getENV('SERVICE_MODE') === 'single') {
                global.SingleServiceSocket = socket;
            } else {
                global.ServiceSocketMap[serviceId as string] = socket;
            }
        }

        log('connection').debug(`${socket.attempt.from} connect success, ip: ${socket.attempt.connection.ip}. service count is ${getServiceCount()}. client count is ${global.ClientServices.size}.`);

        socket.transfer({
            type: 'system',
            method: 'connect',
            data: 'connected'
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
        } as SystemMessage, { from: 'system', to: socket.attempt.from, serviceId, serviceName });


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
                global.ClientServices.delete(socket);

                [
                    ...Object.values(global.ServiceSocketMap),
                    ...global.SingleServiceSocket ? [global.SingleServiceSocket] : []
                ].map(a => {
                    a.transfer({
                        type: 'system',
                        method: 'communicationLinkCount',
                        data: global.ClientServices.size
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                    } as SystemMessage, { from: 'system', to: 'service', serviceId: a.attempt.serviceId, serviceName: a.attempt.serviceName });
                });
            } else {
                if (getENV('SERVICE_MODE') === 'single') {
                    delete global.SingleServiceSocket;
                } else {
                    delete global.ServiceSocketMap[serviceId as string];
                }
                [...global.ClientServices].map(a => {
                    a.transfer({
                        type: 'system',
                        method: 'communicationLinkCount',
                        data: getServiceCount()
                    } as SystemMessage, { from: 'system', to: 'client' });
                });
            }
            log('socket-closed').debug(`a ${socket.attempt.from} is offline. service count is ${getServiceCount()}. client count is ${global.ClientServices.size}.`);
        });
    });
};
