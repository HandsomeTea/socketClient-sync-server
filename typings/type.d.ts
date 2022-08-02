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
    /** serviceId，type为notice时必须 */
    service?: string
    type: 'notice' | 'order-result' | 'response'
    method: string
    data: any
    errorCode?: string
    message?: string
}

declare interface PortalMessage {
    id: string
    /** serviceId，多服务器时必须 */
    service?: string
    type: 'request' | 'order'
    /** 默认所有的method都需要登录才能调用 */
    method: string
    data: any
}

declare type SocketType = 'service' | 'client'
