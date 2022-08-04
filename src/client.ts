import { SurpassSocket } from '../socket';
import { messageError, freeMethods, authMethods, getENV } from '@/configs';

export default (socket: SurpassSocket, message: PortalMessage): void => {
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
        } as SystemMessage, 'system => client');
    } else if (getENV('SERVICE_MODE') === 'multi' && !service) { // service-client多对多时，客户端必须指明向哪个服务器发
        return socket.transfer({
            id,
            type: 'system',
            method: method || 'unknown',
            errorCode: messageError.MISSING_FIELD_SERVICE,
            message: 'message is missing [service] field!'
        } as SystemMessage, 'system => client');
    } else if (!type) {
        return socket.transfer({
            id,
            type: 'system',
            method: method || 'unknown',
            errorCode: messageError.MISSING_FIELD_TYPE,
            message: 'message is missing [type] field!'
        } as SystemMessage, 'system => client');
    } else if (type !== 'order' && type !== 'request') {
        return socket.transfer({
            id,
            type: 'system',
            method: method || 'unknown',
            errorCode: messageError.INVALID_MESSAGE_TYPE,
            message: 'message type must be one of ["order", "request"]!'
        } as SystemMessage, 'system => client');
    } else if (!method) {
        return socket.transfer({
            id,
            type: 'system',
            method: 'unknown',
            errorCode: messageError.MISSING_FIELD_METHOD,
            message: 'message is missing [method] field!'
        } as SystemMessage, 'system => client');
    } else if ((!freeMethods.has(method) || authMethods.has(method)) && !socket.attempt.isLogin) {
        return socket.transfer({
            id,
            type: 'system',
            method,
            errorCode: messageError.FORBIDDEN,
            message: 'you need login to do this.'
        } as SystemMessage, 'system => client');
    } else if (type === 'order' && !data) {
        return socket.transfer({
            id,
            type: 'system',
            method,
            errorCode: messageError.MISSING_FIELD_DATA,
            message: 'order is missing [data] field!'
        } as SystemMessage, 'system => client');
    } else if (method === 'serviceList' && getENV('SERVICE_MODE') === 'multi') {
        const result = [];

        for (const _socket of global.SocketServer.wsClients) {
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
        } as SystemMessage, 'system => client');
    } else if (method === 'communicationLinkCount') {
        return socket.transfer({
            id,
            type: 'system',
            method: 'communicationLinkCount',
            data: global.ServiceCount
        } as SystemMessage, 'system => client');
    }

    socket.attempt.messageTimerRecord[id] = setTimeout(() => {
        socket.transfer({
            id,
            type: type === 'order' ? 'order-result' : 'response',
            method,
            errorCode: messageError.GATEWAY_TIMEOUT,
            message: 'timeout!'
        } as EquipmentMessage, 'system => client');

        if (socket.attempt.from === 'client') {
            clearTimeout(socket.attempt.messageTimerRecord[id]);
            delete socket.attempt.messageTimerRecord[id];
        }
    }, 10 * 1000);

    if (getENV('SERVICE_MODE') === 'single') {
        global.SingleServiceSocket.transfer({ id, type, method, data }, 'client => service');
    } else {
        global.ServiceSocketMap[service as string].transfer({ id, type, method, data }, 'client => service');
    }
};
