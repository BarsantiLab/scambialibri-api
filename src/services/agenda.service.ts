import * as Agenda from 'agenda';
import { injectable } from 'inversify';

import { Configuration } from 'core/config';
import { Logger } from 'core/log';

@injectable()
export class AgendaService {
    private _agenda: Agenda;
    private _started = false;

    constructor(
        private _config: Configuration,
        private _log: Logger
    ) {
        const password = this._config.mongo.password ? `:${this._config.mongo.password}` : '';
        const auth = (this._config.mongo.user || password) ? this._config.mongo.user + password + '@' : '';
        const uri = `mongodb://${auth}${this._config.mongo.host}/${this._config.mongo.database}`;

        this._agenda = new Agenda({
            db: {
                address: uri,
                collection: 'agendas'
            },
            processEvery: '1 second'
        });

        this._agenda.on('ready', () => {
            if (this._started) return;

            this._started = true;
            this._agenda.start();
            this._log.info('Agenda: agenda service started');
        });
    }

    schedule(date: Date|string, jobName: string, data?: any): void {
        this._agenda.schedule(date, jobName, data, (err) => {
            if (err) {
                this._log.error(err.name + ': ' + err.message);
            } else {
                this._log.info(`Job '${jobName} completed!`);
            }
        });
    }

    define(jobName: string, callback: (job: any, done: (err?) => void) => void): void {
        this._agenda.define(jobName, callback);
    }
}
