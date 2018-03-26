import { injectable } from 'inversify';

import { Configuration } from 'core/config';
import { Db } from 'core/db';
import { Logger } from 'core/log';
import { PassportConfiguration } from 'core/passport';

import { ResponseService } from 'services/response.service';

import { RouterFactory } from 'api/router';

import * as bodyParser from 'body-parser';
import * as compression from 'compression';
import * as cors from 'cors';
import * as express from 'express';
import * as helmet from 'helmet';
import * as http from 'http';
import * as passport from 'passport';

@injectable()
export class Api {
    private _app: express.Application;
    private _server: http.Server;

    constructor(
        private _config: Configuration,
        private _logger: Logger,
        private _db: Db,
        private _passport: PassportConfiguration,
        private _route: RouterFactory,
        private _responseService: ResponseService
    ) { }

    async setup(): Promise<any> {
        this._app = express();

        this._app.use(cors());
        this._app.use(helmet());

        // CSP Protection
        this._app.use(helmet.contentSecurityPolicy({
            directives: {
                defaultSrc: ["'self'"]
            }
        }));

        // Referrer policy protection
        this._app.use(helmet.referrerPolicy({
            policy: 'same-origin'
        }));

        // Disable cache client-side
        this._app.use(helmet.noCache());

        // Enable gzip compression
        this._app.use(compression());

        // Enable body parser for JSON and querystring
        this._app.use(bodyParser.json());
        this._app.use(bodyParser.urlencoded({ extended: true }));

        // Setup DB connection and models
        await this._db.setup();

        // Setup passport and its strategies for authentication
        this._app.use(passport.initialize());
        this._passport.initStrategies();

        // Setup logging middleware
        this._logger.setupApp(this._app);

        // Setup controllers routes
        this._app.use(this._route.router);

        // Setup custom error handling
        this._app.use(this._responseService.errorMiddleware.bind(this._responseService));
    }

    async listen(): Promise<any> {
        return new Promise((resolve) => {
            this._server = this._app.listen(this._config.http.port, () => {
                this._logger.log.info('Server listening on port ' + this._config.http.port);
                resolve();
            });
        });
    }

    async close(): Promise<any> {
        return new Promise((resolve) => {
            this._server.close(() => {
                this._logger.log.debug('Server connection closed!');
                resolve();
            });
        });
    }
}
