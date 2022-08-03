import './startup';
import { log, getENV } from '@/configs';

process.on('unhandledRejection', reason => {
    log('SYSTEM').fatal(reason);
});

process.on('uncaughtException', reason => {
    log('SYSTEM').fatal(reason);
});

import { createServer } from 'http';

const server = createServer();
const port = Number(getENV('PORT'));

import SocketService from '@/index';
import { AddressInfo } from 'net';
SocketService(server);

const onError = (error: { syscall: string, code: string }) => {
    if (error.syscall !== 'listen') {
        throw error;
    }

    const bind = `Port ${port}`;

    switch (error.code) {
        case 'EACCES':
            log('startup').error(`${bind} requires elevated privileges`);
            process.exit(1);
            break;
        case 'EADDRINUSE':
            log('startup').error(`${bind} is already in use`);
            process.exit(1);
            break;
        default:
            throw error;
    }
};


server.on('error', onError);
server.listen(port, '0.0.0.0', () => {
    const address = server.address() as AddressInfo;

    log('server-startup').info(`sync-service is startup:\n${JSON.stringify({ ...address, path: global.SocketServer.options.path }, null, '   ')}`);
});
