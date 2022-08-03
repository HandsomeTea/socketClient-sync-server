import { SurpassSocket } from '../socket';
import { messageError, freeMethods, authMethods, getENV } from '@/configs';

export default (socket: SurpassSocket, message: PortalMessage): void => {
    if (global.ServiceCount === 0) {
        return socket.transfer({
            type: 'system',
            method: 'communicationLinkCount',
            data: 0
        } as SystemMessage, 'system');
    }

    const { id, service, type, method, data } = message;

    if (!id) {
        return socket.transfer({
            type: 'system',
            method: method || 'unknown',
            errorCode: messageError.MISSING_FIELD_ID,
            message: 'message is missing [id] field!'
        } as SystemMessage, 'system');
    }

    // service-client多对多时，客户端必须指明向哪个服务器发
    if (getENV('SERVICE_MODE') === 'multi' && !service) {
        return socket.transfer({
            id,
            type: 'system',
            method: method || 'unknown',
            errorCode: messageError.MISSING_FIELD_SERVICE,
            message: 'message is missing [service] field!'
        } as SystemMessage, 'system');
    }

    if (!type) {
        return socket.transfer({
            id,
            type: 'system',
            method: method || 'unknown',
            errorCode: messageError.MISSING_FIELD_TYPE,
            message: 'message is missing [type] field!'
        } as SystemMessage, 'system');
    }

    if (type !== 'order' && type !== 'request') {
        return socket.transfer({
            id,
            type: 'system',
            method: method || 'unknown',
            errorCode: messageError.INVALID_MESSAGE_TYPE,
            message: 'message type must be one of ["order", "request"]!'
        } as SystemMessage, 'system');
    }

    if (!method) {
        return socket.transfer({
            id,
            type: 'system',
            method: 'unknown',
            errorCode: messageError.MISSING_FIELD_METHOD,
            message: 'message is missing [method] field!'
        } as SystemMessage, 'system');
    }

    if ((!freeMethods.has(method) || authMethods.has(method)) && !socket.isLogin) {
        return socket.transfer({
            id,
            type: 'system',
            method,
            errorCode: messageError.FORBIDDEN,
            message: 'you need login to do this.'
        } as SystemMessage, 'system');
    }

    if (type === 'order' && !data) {
        return socket.transfer({
            id,
            type: 'system',
            method,
            errorCode: messageError.MISSING_FIELD_DATA,
            message: 'order is missing [data] field!'
        } as SystemMessage, 'system');
    }

    if (method === 'serviceList' && getENV('SERVICE_MODE') === 'multi') {
        const result = [];

        for (const _socket of global.SocketServer.wsClients) {
            if (_socket.from === 'service') {
                result.push({
                    id: _socket.serviceId,
                    name: _socket.serviceName
                });
            }
        }
        return socket.transfer({
            id,
            type: 'response',
            method: 'serviceList',
            data: result
        } as EquipmentMessage, 'system');
    }

    socket.messageTimerRecord[id] = setTimeout(() => {
        socket.transfer({
            id,
            type: type === 'order' ? 'order-result' : 'response',
            method,
            errorCode: messageError.GATEWAY_TIMEOUT,
            message: 'timeout!'
        } as EquipmentMessage, 'system');

        clearTimeout(socket.messageTimerRecord[id]);
        delete socket.messageTimerRecord[id];
    }, 10 * 1000);

    for (const _socket of global.SocketServer.wsClients) {
        if (_socket.from === 'service') {
            if (getENV('SERVICE_MODE') === 'single') {
                _socket.transfer({ id, type, method, data }, 'client');
            } else {
                if (_socket.serviceId === service) {
                    _socket.transfer({ id, type, method, data }, 'client');
                }
            }
        }
    }
};
