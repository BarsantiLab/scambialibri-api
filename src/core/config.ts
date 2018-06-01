import * as _ from 'lodash';
// import { checkExist } from 'utils/promise-fs';

import { injectable } from 'inversify';
import * as minimist from 'minimist';

const defaultConf = {
    debug: {
        sendErrorsToClient: true,
        sendStackToClient: true,
        preventMailSending: true
    },

    google: {
        geoUrl: 'https://maps.googleapis.com/maps/api/geocode/json',
        token: 'AIzaSyDassqWcpf1kl0v4_T8ZiVtgOZYatrLs3w'
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
        // IMPROVE: changing by environment
        baseDomain: 'https://sca-site.iamdavi.de'
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

        // TODO: load configuration from env/cmd line arguments
    }

    setConfiguration(conf: object = {}) {
        const c = _.merge(defaultConf, conf);
        Object.assign(this, c);
    }
}
