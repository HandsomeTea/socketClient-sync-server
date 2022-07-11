global.Exception = class Exception extends Error {
    public msg: string;
    public type?: string;
    public reason?: Array<string>;

    constructor(messageOrErrorOrException?: string | InstanceException | Error, type?: string, reason?: Array<string>) {
        super();
        if (typeof messageOrErrorOrException === 'string') {
            this.msg = messageOrErrorOrException;
        } else {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            this.msg = messageOrErrorOrException?.msg || messageOrErrorOrException?.message || 'inner server error!';
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            this.type = messageOrErrorOrException?.type;
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            this.reason = messageOrErrorOrException?.reason;
        }

        if (type && !this.type) {
            this.type = type;
        }

        if (reason && reason.length > 0) {
            if (!this.reason) {
                this.reason = [];
            }
            this.reason.push(...reason);
        }

        if (!this.type) {
            this.type = 'INTERNAL_SERVER_ERROR';
        }
    }
};
