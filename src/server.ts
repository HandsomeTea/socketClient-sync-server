import { SurpassSocket } from '../socket';
import { getENV, messageError } from '@/configs';

export default (socket: SurpassSocket, msg: EquipmentMessage): void => {
    if (global.ClientCount === 0) {
        return socket.transfer({
            type: 'system',
            method: 'communicationLinkCount',
            data: 0
        } as SystemMessage, 'system');
    }

    const { id, service, type, method, data, errorCode, message } = msg;

    if (!type) {
        return socket.transfer({
            id,
            type: 'system',
            method: method || 'unknown',
            errorCode: messageError.MISSING_FIELD_TYPE,
            message: 'message is missing [type] field!'
        } as SystemMessage, 'system');
    }

    if (type !== 'notice' && type !== 'order-result' && type !== 'response') {
        return socket.transfer({
            id,
            type: 'system',
            method: method || 'unknown',
            errorCode: messageError.INVALID_MESSAGE_TYPE,
            message: 'message type is one of ["notice", "order-result", "response"]!'
        } as SystemMessage, 'system');
    }

    if (type !== 'notice' && !id) {
        return socket.transfer({
            type: 'system',
            method: method || 'unknown',
            errorCode: messageError.MISSING_FIELD_ID,
            message: 'message is missing [id] field!'
        } as SystemMessage, 'system');
    }

    // service-client多对多时，服务器的通知必须带自己的标识
    if (type === 'notice' && getENV('SERVICE_MODE') === 'multi' && !service) {
        return socket.transfer({
            type: 'system',
            method: method || 'unknown',
            errorCode: messageError.MISSING_FIELD_SERVICE,
            message: 'message is missing [service] field!'
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

    if (!data && !errorCode) {
        return socket.transfer({
            id,
            type: 'system',
            method,
            errorCode: messageError.INVALID_MESSAGE,
            message: 'there must be one of [data] and [errorCode] field!'
        } as SystemMessage, 'system');
    }

    if (errorCode && !/^[A-Z_]+$/.test(errorCode)) {
        return socket.transfer({
            id,
            type: 'system',
            method,
            errorCode: messageError.INVALID_MESSAGE,
            message: '[errorCode] field can only contain uppercase letters and underscores!'
        } as SystemMessage, 'system');
    }

    if (errorCode && !message) {
        return socket.transfer({
            id,
            type: 'system',
            method,
            errorCode: messageError.INVALID_MESSAGE,
            message: 'message is missing [message] field!'
        } as SystemMessage, 'system');
    }

    for (const _socket of global.SocketServer.wsClients) {
        if (_socket.from === 'client') {
            if (type === 'notice' && !errorCode) {
                _socket.transfer({
                    ...getENV('SERVICE_MODE') === 'multi' ? { service } : {},
                    type, method, data
                }, 'service');
            } else {
                if (id && _socket.messageTimerRecord[id]) {
                    clearTimeout(_socket.messageTimerRecord[id]);
                    delete _socket.messageTimerRecord[id];
                    _socket.transfer({ id, type, method, data, errorCode }, 'service');
                    if (!errorCode && method === 'login') {
                        _socket.isLogin = true;
                    }
                }
            }
        }
    }
};
