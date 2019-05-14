import { injectable } from 'inversify';

import * as _ from 'lodash';
import * as path from 'path';
import * as fs from 'utils/promise-fs';

import * as Sendgrid from '@sendgrid/mail';

import { Configuration } from 'core/config';
import { Logger } from 'core/log';

@injectable()
export class MailService {
    constructor(
        private _config: Configuration,
        private _log: Logger
    ) {
        Sendgrid.setApiKey(this._config.mail.sendgridAPIKey);
    }

    async send(conf: IMailConfiguration) {
        if (this._config.debug.preventMailSending) {
            this._log.debug(`Mail skipped by configuration: "${conf.subject}" (${conf.to})`);
            this._log.debug(JSON.stringify(conf.data, null, 4));
            return;
        }

        let template: string = await fs.readFile(path.resolve(`release/js/mails/${conf.template}.html`));

        if (conf.data) {
            // IMPROVE: fix extensible variable injection
            conf.data.baseDomain = this._config.mail.baseDomain;

            _.forIn(conf.data, (value, key) => {
                template = template.replace(new RegExp('{{' + key + '}}', 'gm'), value);
            });
        }

        // IMPROVE: fix from show name (now noreply)
        const mailData: any = {
            from: this._config.mail.from,
            to: conf.to,
            subject: `LoScambialibri.it - ${conf.subject}`,
            html: template
        };

        return new Promise((resolve, reject) => {
            Sendgrid.send(mailData, false, (err, body) => {
                this._log.info(`Mail sent: "${mailData.subject}" (${mailData.to})`);
                if (err) return reject(err);
                resolve(body);
            });
        });
    }
}

// IMPROVE: put template names into enum
export interface IMailConfiguration {
    template: string;
    data?: any;
    to: string;
    subject: string;
}
