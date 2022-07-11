declare interface InstanceException {
    msg: string;
    type?: string;
    reason?: Array<string>;
}

declare interface ExceptionConstructor {
    new(messageOrError?: string | InstanceException | Error, type?: string, reason?: Array<string>): InstanceException;
    readonly prototype: InstanceException;
}

declare const Exception: ExceptionConstructor;

declare interface SystemMessage {
    id?: string
    type: 'system'
    method: string
    data: any
    errorCode?: string
    message?: string
}

declare interface EquipmentMessage {
    id?: string
    type: 'notice' | 'order-result' | 'response'
    method: string
    data: any
    errorCode?: string
    message?: string
}

declare interface PortalMessage {
    id: string
    type: 'request' | 'order'
    method: string
    data: any
}

declare type SocketType = 'service' | 'client'
