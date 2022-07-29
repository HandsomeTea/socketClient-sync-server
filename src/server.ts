import { SurpassSocket } from '../socket';
import { log, messageError } from '@/configs';

export default (socket: SurpassSocket, msg: EquipmentMessage): void => {
    if (global.ClientCount === 0) {
        return socket.send(JSON.stringify({
            type: 'system',
            method: 'communicationLinkCount',
            data: 0
        } as SystemMessage));
    }

    const { id, type, method, data, errorCode, message } = msg;

    log('receive-from-service').debug(msg);
    if (!type) {
        log('receive-from-service').error('message is missing [type] field!');
        return socket.send(JSON.stringify({
            id,
            type: 'system',
            method: method || 'unknown',
            errorCode: messageError.MISSING_FIELD_TYPE,
            message: 'message is missing [type] field!'
        } as SystemMessage));
    }

    if (type !== 'notice' && type !== 'order-result' && type !== 'response') {
        log('receive-from-service').error('message type is one of ["notice", "order-result", "response"]!');
        return socket.send(JSON.stringify({
            id,
            type: 'system',
            method: method || 'unknown',
            errorCode: messageError.INVALID_MESSAGE_TYPE,
            message: 'message type is one of ["notice", "order-result", "response"]!'
        } as SystemMessage));
    }

    if (type !== 'notice' && !id) {
        log('receive-from-service').error('message is missing [id] field!');
        return socket.send(JSON.stringify({
            type: 'system',
            method: method || 'unknown',
            errorCode: messageError.MISSING_FIELD_ID,
            message: 'message is missing [id] field!'
        } as SystemMessage));
    }

    if (!method) {
        log('receive-from-service').error('message is missing [method] field!');
        return socket.send(JSON.stringify({
            id,
            type: 'system',
            method: 'unknown',
            errorCode: messageError.MISSING_FIELD_METHOD,
            message: 'message is missing [method] field!'
        } as SystemMessage));
    }

    if (!data && !errorCode) {
        log('receive-from-service').error('there must be one of [data] and [errorCode] field!');
        return socket.send(JSON.stringify({
            id,
            type: 'system',
            method,
            errorCode: messageError.INVALID_MESSAGE,
            message: 'there must be one of [data] and [errorCode] field!'
        } as SystemMessage));
    }

    if (errorCode && !/^[A-Z_]+$/.test(errorCode)) {
        log('receive-from-service').error('[errorCode] field can only contain uppercase letters and underscores!');
        return socket.send(JSON.stringify({
            id,
            type: 'system',
            method,
            errorCode: messageError.INVALID_MESSAGE,
            message: '[errorCode] field can only contain uppercase letters and underscores!'
        } as SystemMessage));
    }

    if (errorCode && !message) {
        log('receive-from-service').error('message is missing [message] field!');
        return socket.send(JSON.stringify({
            id,
            type: 'system',
            method,
            errorCode: messageError.INVALID_MESSAGE,
            message: 'message is missing [message] field!'
        } as SystemMessage));
    }

    for (const _socket of global.SocketServer.wsClients) {
        if (_socket.from === 'client') {
            if (type === 'notice' && !errorCode) {
                log('service-send').info({ type, method, data });
                _socket.send(JSON.stringify({ type, method, data }));
            } else {
                if (id && _socket.messageTimerRecord[id]) {
                    log('service-send').info({ id, type, method, data, errorCode });
                    _socket.send(JSON.stringify({ id, type, method, data, errorCode }));
                    clearTimeout(_socket.messageTimerRecord[id]);
                    delete _socket.messageTimerRecord[id];
                    if (!errorCode && method === 'login') {
                        _socket.isLogin = true;
                    }
                }
                // else if (!errorCode) {
                //     log('service-send').info({ type: 'notice', method, data });
                //     _socket.send(JSON.stringify({ type: 'notice', method, data } as EquipmentMessage));
                // }
            }
        }
    }
};
