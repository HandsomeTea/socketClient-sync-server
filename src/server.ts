import { SurpassSocket } from '../socket';
import { getENV, messageError } from '@/configs';

export default (socket: SurpassSocket, msg: ServerMessage): void => {
    if (socket.attempt.from !== 'service') {
        return;
    }
    const { id, service, type, method, data, errorCode, message } = msg;
    const { serviceId, serviceName } = socket.attempt;

    if (!type) {
        return socket.transfer({
            id,
            type: 'system',
            method: method || 'unknown',
            errorCode: messageError.MISSING_FIELD_TYPE,
            message: 'message is missing [type] field!'
        } as SystemMessage, { from: 'system', to: 'service', serviceId, serviceName });
    } else if (type !== 'notice' && type !== 'response') {
        return socket.transfer({
            id,
            type: 'system',
            method: method || 'unknown',
            errorCode: messageError.INVALID_MESSAGE_TYPE,
            message: 'message type is one of ["notice", "response"]!'
        } as SystemMessage, { from: 'system', to: 'service', serviceId, serviceName });
    } else if (type !== 'notice' && !id) {
        return socket.transfer({
            type: 'system',
            method: method || 'unknown',
            errorCode: messageError.MISSING_FIELD_ID,
            message: 'message is missing [id] field!'
        } as SystemMessage, { from: 'system', to: 'service', serviceId, serviceName });
    } else if (type === 'notice' && getENV('SERVICE_MODE') === 'multi' && !service) { // service-client多对多时，服务器的通知必须带自己的标识
        return socket.transfer({
            type: 'system',
            method: method || 'unknown',
            errorCode: messageError.MISSING_FIELD_SERVICE,
            message: 'message is missing [service] field!'
        } as SystemMessage, { from: 'system', to: 'service', serviceId, serviceName });
    } else if (!method) {
        return socket.transfer({
            id,
            type: 'system',
            method: 'unknown',
            errorCode: messageError.MISSING_FIELD_METHOD,
            message: 'message is missing [method] field!'
        } as SystemMessage, { from: 'system', to: 'service', serviceId, serviceName });
    } else if (!data && !errorCode) {
        return socket.transfer({
            id,
            type: 'system',
            method,
            errorCode: messageError.INVALID_MESSAGE,
            message: 'there must be one of [data] and [errorCode] field!'
        } as SystemMessage, { from: 'system', to: 'service', serviceId, serviceName });
    } else if (errorCode && !/^[A-Z_]+$/.test(errorCode)) {
        return socket.transfer({
            id,
            type: 'system',
            method,
            errorCode: messageError.INVALID_MESSAGE,
            message: '[errorCode] field can only contain uppercase letters and underscores!'
        } as SystemMessage, { from: 'system', to: 'service', serviceId, serviceName });
    } else if (errorCode && !message) {
        return socket.transfer({
            id,
            type: 'system',
            method,
            errorCode: messageError.INVALID_MESSAGE,
            message: 'message is missing [message] field!'
        } as SystemMessage, { from: 'system', to: 'service', serviceId, serviceName });
    } else if (method === 'communicationLinkCount') {
        return socket.transfer({
            id,
            type: 'system',
            method: 'communicationLinkCount',
            data: global.ClientServices.size
        } as SystemMessage, { from: 'system', to: 'service', serviceId, serviceName });
    }

    for (const _socket of global.ClientServices) {
        if (_socket.attempt.from === 'client') {
            if (type === 'notice' && !errorCode) {
                _socket.transfer({
                    ...getENV('SERVICE_MODE') === 'multi' ? { service } : {},
                    type, method, data
                }, { from: 'service', to: 'client', serviceId, serviceName });
            } else {
                if (id && _socket.attempt.messageTimerRecord[id]) {
                    clearTimeout(_socket.attempt.messageTimerRecord[id]);
                    delete _socket.attempt.messageTimerRecord[id];
                    _socket.transfer({ id, type, method, data, errorCode, message }, { from: 'service', to: 'client', serviceId, serviceName });
                }
            }
        }
    }
};
