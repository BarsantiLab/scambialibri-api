import * as dotenv from 'dotenv';
import * as _ from 'lodash';

import { injectable } from 'inversify';
import * as minimist from 'minimist';

// WARN: check for env file existance
dotenv.config();

// IMPROVE: integrate https://github.com/mozilla/node-convict

const defaultConf = {
    debug: {
        sendErrorsToClient: true,
        sendStackToClient: true,
        preventMailSending: false
    },

    google: {
        geoUrl: 'https://maps.googleapis.com/maps/api/geocode/json',
        token: process.env.SL_GOOGLE_TOKEN
    },

    http: {
        port: 1337
    },

    log: {
        http: true,
        level: 'debug',
        timestamp: true,
    },

    mail: {
        apiKey: process.env.SL_MAILGUN_API_KEY,
        domain: process.env.SL_MAILGUN_DOMAIN,
        baseDomain: process.env.SL_MAIL_DOMAIN,
        from: 'noreply@loscambialibri.it',
    },

    mongo: {
        database: process.env.SL_MONGO_DB,
        host: process.env.SL_MONGO_HOST,
        password: process.env.SL_MONGO_PASSWORD,
        user: process.env.SL_MONGO_USER
    },

    test: {
        mongo: {
            database: 'Scambialibri-test',
            host: 'localhost',
            password: null,
            user: null
        }
    },

    token: {
        expiration: 2000000
    }
};

@injectable()
export class Configuration {
    log: {
        timestamp: boolean;
        level: string;
        http: boolean;
    };

    google: {
        geoUrl: string;
        token: string;
    };

    mail: {
        apiKey: string;
        domain: string;
        from: string;
        baseDomain: string;
    };

    mongo: {
        user: string;
        password: string;
        host: string;
        database: string;
    };

    http: {
        port: number
    };

    token: {
        expiration: number;
    };

    test: {
        mongo: {
            user: string;
            password: string;
            host: string;
            database: string;
        };
    };

    debug: {
        sendStackToClient: boolean;
        sendErrorsToClient: boolean;
        preventMailSending: boolean;
    };

    constructor() {
        const argv = minimist(process.argv.slice(2));
        if (argv.port) defaultConf.http.port = argv.port;

        this.setConfiguration();
    }

    setConfiguration(conf: object = {}) {
        const c = _.merge(defaultConf, conf);
        Object.assign(this, c);
    }
}
