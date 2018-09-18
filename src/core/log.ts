import { Configuration } from 'core/config';
import { injectable } from 'inversify';

import * as dateFormat from 'dateformat';
import * as express from 'express';
import * as expressWinston from 'express-winston';
import * as winston from 'winston';
import * as winstonCommon from 'winston/lib/winston/common';

@injectable()
export class Logger {
    log: winston.LoggerInstance;
    transports: winston.TransportInstance[] = [];

    constructor(private _config: Configuration) {
        winston.transports.Console.prototype.log = function(level, message, meta, callback) {
            const output = winstonCommon.log(Object.assign({}, this, {
                level, message, meta
            }));

            console[level in console ? level : 'log'](output);
            setImmediate(callback, null, true);
        };

        if (process.env.PC_SILENT !== 'true') {
            this.transports.push(new winston.transports.Console({
                colorize: true,
                json: false,
                stderrLevels: ['error'],
                timestamp: (this._config.log.timestamp) ? () => {
                    return (winston as any).config.colorize('data', dateFormat(new Date(), 'isoDateTime'));
                } : false,
                useTimestamp: this._config.log.level
            }));
        }

        this.log = new winston.Logger({
            level: this._config.log.level,
            transports: this.transports
        });

        this.log.info(`Current environment: ${process.env.NODE_ENV}`);
        this.log.info(`Logger: log level ${this._config.log.level}`);
    }

    error(message) {
        return this.log.error(message);
    }

    debug(message) {
        return this.log.debug(message);
    }

    info(message) {
        return this.log.log('info', message);
    }

    silly(message) {
        return this.log.log('silly', message);
    }

    setupApp(app: express.Application) {
        if (this._config.log.http) {
            app.use(expressWinston.logger({
                colorize: true,
                meta: false,
                msg: '{{req.method}} {{req.url}} {{res.responseTime}}ms {{res.statusCode}}',
                winstonInstance: this.log
            }));
        }
    }
}
