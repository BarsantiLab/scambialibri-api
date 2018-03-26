import * as _ from 'lodash';
// import { checkExist } from 'utils/promise-fs';

import { injectable } from 'inversify';

const defaultConf = {
    debug: {
        sendErrorsToClient: true,
        sendStackToClient: true
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
        apiKey: 'key-fee6b455d644bedebf9f5a53a08feaf7',
        domain: 'sandbox470e6f41e2444c1daeeeffea13957418.mailgun.org',
        from: 'noreply@scambialibri.it',
        baseDomain: 'http://localhost:8080'
    },

    mongo: {
        database: 'Scambialibri',
        host: 'localhost',
        password: null,
        user: null
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
    };

    constructor() {
        this.setConfiguration();

        // TODO: load configuration from env/cmd line arguments
    }

    setConfiguration(conf: object = {}) {
        const c = _.merge(defaultConf, conf);
        Object.assign(this, c);
    }
}
