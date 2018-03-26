require('app-module-path').addPath(__dirname + '/../');
import 'reflect-metadata';

import { InversifyContainer } from 'core/inversify';
import { Logger } from 'core/log';

import { Api } from 'api/api';

import * as errorHandler from 'utils/error-handling';

let log: Logger;
log = InversifyContainer.get<Logger>(Logger);

process.on('unhandledRejection', handleRejections.bind(this));
process.on('uncaughtException', handleRejections.bind(this));

(async () => {
    const server = InversifyContainer.get<Api>(Api);
    await server.setup();
    server.listen();
})();

function handleRejections(err) {
    errorHandler.handleRejections(err, log);
}
