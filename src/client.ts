import { SurpassSocket } from '../socket';
import { log, messageError, freeMethods, authMethods } from '@/configs';

export default (socket: SurpassSocket, message: PortalMessage): void => {
    if (global.ServiceCount !== global.ServiceLimit) {
        return socket.send(JSON.stringify({
            type: 'system',
            method: 'communicationLinkCount',
            data: global.ServiceCount
        } as SystemMessage));
    }

    const { id, type, method, data } = message;

    log('receive-from-client').debug(message);
    if (!id) {
        log('receive-from-client').error('message is missing [id] field!');
        return socket.send(JSON.stringify({
            type: 'system',
            method: method || 'unknown',
            errorCode: messageError.MISSING_FIELD_ID,
            message: 'message is missing [id] field!'
        } as SystemMessage));
    }

    if (!type) {
        log('receive-from-client').error('message is missing [type] field!');
        return socket.send(JSON.stringify({
            id,
            type: 'system',
            method: method || 'unknown',
            errorCode: messageError.MISSING_FIELD_TYPE,
            message: 'message is missing [type] field!'
        } as SystemMessage));
    }

    if (type !== 'order' && type !== 'request') {
        log('receive-from-client').error('message type is one of ["order", "request"]!');
        return socket.send(JSON.stringify({
            id,
            type: 'system',
            method: method || 'unknown',
            errorCode: messageError.INVALID_MESSAGE_TYPE,
            message: 'message type is one of ["order", "request"]!'
        } as SystemMessage));
    }

    if (!method) {
        log('receive-from-client').error('message is missing [method] field!');
        return socket.send(JSON.stringify({
            id,
            type: 'system',
            method: 'unknown',
            errorCode: messageError.MISSING_FIELD_METHOD,
            message: 'message is missing [method] field!'
        } as SystemMessage));
    }

    if (!freeMethods.has(method) && !authMethods.has(method)) {
        log('receive-from-client').error('unknown method!');
        return socket.send(JSON.stringify({
            id,
            type: 'system',
            method,
            errorCode: messageError.INVALID_MESSAGE,
            message: 'unknown method!'
        } as SystemMessage));
    }

    if (authMethods.has(method) && !socket.isLogin) {
        log('receive-from-client').error('you need login to do this.');
        return socket.send(JSON.stringify({
            id,
            type: 'system',
            method,
            errorCode: messageError.FORBIDDEN,
            message: 'you need login to do this.'
        } as SystemMessage));
    }

    if (type === 'order' && !data) {
        log('receive-from-client').error('order is missing [data] field!');
        return socket.send(JSON.stringify({
            id,
            type: 'system',
            method,
            errorCode: messageError.MISSING_FIELD_DATA,
            message: 'order is missing [data] field!'
        } as SystemMessage));
    }

    log('client-send').info(message);

    socket.messageTimerRecord[id] = setTimeout(() => {
        socket.send(JSON.stringify({
            id,
            type: type === 'order' ? 'order-result' : 'response',
            method,
            errorCode: messageError.GATEWAY_TIMEOUT
        } as EquipmentMessage));

        clearTimeout(socket.messageTimerRecord[id]);
        delete socket.messageTimerRecord[id];
    }, 10 * 1000);

    for (const _socket of global.SocketServer.wsClients) {
        if (_socket.from === 'service') {
            _socket.send(JSON.stringify({ id, type, method, data }));
        }
    }
};
