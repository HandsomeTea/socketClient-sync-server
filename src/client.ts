import { ServiceWebSocketAttempt, SurpassSocket } from '../socket';
import { messageError, getENV } from '@/configs';
import { getServiceCount } from './lib';

export default (socket: SurpassSocket, message: ClientMessage): void => {
    if (socket.attempt.from !== 'client') {
        return;
    }
    const { id, service, type, method, data } = message;

    if (!id) {
        return socket.transfer({
            type: 'system',
            method: method || 'unknown',
            errorCode: messageError.MISSING_FIELD_ID,
            message: 'message is missing [id] field!'
        } as SystemMessage, { from: 'system', to: 'client' });
    } else if (!type) {
        return socket.transfer({
            id,
            type: 'system',
            method: method || 'unknown',
            errorCode: messageError.MISSING_FIELD_TYPE,
            message: 'message is missing [type] field!'
        } as SystemMessage, { from: 'system', to: 'client' });
    } else if (type !== 'request') {
        return socket.transfer({
            id,
            type: 'system',
            method: method || 'unknown',
            errorCode: messageError.INVALID_MESSAGE_TYPE,
            message: 'message type must be one of ["request"]!'
        } as SystemMessage, { from: 'system', to: 'client' });
    } else if (!method) {
        return socket.transfer({
            id,
            type: 'system',
            method: 'unknown',
            errorCode: messageError.MISSING_FIELD_METHOD,
            message: 'message is missing [method] field!'
        } as SystemMessage, { from: 'system', to: 'client' });
    } else if (method === 'serviceList' && getENV('SERVICE_MODE') === 'multi' && type === 'request') {
        const result = [];

        for (const _socket of Object.values(global.ServiceSocketMap)) {
            if (_socket.attempt.from === 'service') {
                result.push({
                    id: _socket.attempt.serviceId,
                    name: _socket.attempt.serviceName
                });
            }
        }
        return socket.transfer({
            id,
            type: 'system',
            method: 'serviceList',
            data: result
        } as SystemMessage, { from: 'system', to: 'client' });
    } else if (method === 'communicationLinkCount' && type === 'request') {
        return socket.transfer({
            id,
            type: 'system',
            method: 'communicationLinkCount',
            data: getServiceCount()
        } as SystemMessage, { from: 'system', to: 'client' });
    } else if (getENV('SERVICE_MODE') === 'multi' && !service) { // service-client多对多时，客户端必须指明向哪个服务器发
        return socket.transfer({
            id,
            type: 'system',
            method: method || 'unknown',
            errorCode: messageError.MISSING_FIELD_SERVICE,
            message: 'message is missing [service] field!'
        } as SystemMessage, { from: 'system', to: 'client' });
    }

    socket.attempt.messageTimerRecord[id] = setTimeout(() => {
        socket.transfer({
            id,
            type: 'response',
            method,
            errorCode: messageError.GATEWAY_TIMEOUT,
            message: 'timeout!'
        } as ServerMessage, { from: 'system', to: 'client' });

        if (socket.attempt.from === 'client') {
            clearTimeout(socket.attempt.messageTimerRecord[id]);
            delete socket.attempt.messageTimerRecord[id];
        }
    }, 10 * 1000);

    if (getENV('SERVICE_MODE') === 'single') {
        global.SingleServiceSocket?.transfer({ id, type, method, data }, { from: 'client', to: 'service' });
    } else {
        const { serviceId, serviceName } = global.ServiceSocketMap[service as string].attempt as ServiceWebSocketAttempt;

        global.ServiceSocketMap[service as string].transfer({ id, type, method, data }, { from: 'client', to: 'service', serviceId, serviceName });
    }
};
