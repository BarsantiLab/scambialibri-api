import { injectable } from 'inversify';

import * as _ from 'lodash';
import * as Mailgun from 'mailgun-js';
import * as path from 'path';
import * as fs from 'utils/promise-fs';

import { Configuration } from 'core/config';
import { Logger } from 'core/log';

@injectable()
export class MailService {
    private _mailgunService: any;

    constructor(
        private _config: Configuration,
        private _log: Logger
    ) {
        this._mailgunService = Mailgun({
            apiKey: this._config.mail.apiKey,
            domain: this._config.mail.domain
        });
    }

    async send(conf: IMailConfiguration) {
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
            subject: conf.subject,
            html: template
        };

        return new Promise((resolve, reject) => {
            this._mailgunService.messages().send(mailData, (err, body) => {
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
