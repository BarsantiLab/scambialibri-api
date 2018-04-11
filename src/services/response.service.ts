import { injectable } from 'inversify';

import { Configuration } from 'core/config';
import { ApiError } from 'core/error-codes';
import { Logger } from 'core/log';

export interface IErrorResponseBody {
    message: any;
    stack?: any;
    code?: number;
    data?: any;
}

@injectable()
export class ResponseService {
    constructor(
        private _logger: Logger,
        private _config: Configuration
    ) { }

    errorMiddleware(err, req, res, next) {
        let status: number = 500;
        let responseBody: IErrorResponseBody;

        if (err instanceof ApiError) {
            responseBody = {
                code: err.errorCodeObject.code,
                message: err.errorCodeObject.message,
                stack: err.stack
            };

            if (err.data) {
                responseBody.data = err.data;
            }

            status = err.errorCodeObject.status;
        } else if (err instanceof Error) {
            responseBody = {
                message: err.message,
                stack: err.stack
            };
        } else {
            responseBody = {
                message: err
            };
        }

        switch (status) {
            case 400: return this.badRequest(responseBody, req, res, next);
            case 401: return this.unauthorized(responseBody, req, res, next);
            case 403: return this.forbidden(responseBody, req, res, next);
            case 404: return this.notFount(responseBody, req, res, next);
            default: return this.serverError(responseBody, req, res, next);
        }
    }

    serverError(err: IErrorResponseBody, req, res, next) {
        if (!this._config.debug.sendErrorsToClient) {
            return res.status(500).send();
        }

        res.status(500).send({
            code: err.code,
            data: err.data,
            message: err.message,
            stack: this._config.debug.sendStackToClient ? err.stack : undefined,
        });

        this._logger.error(err);
        process.exit(1);
    }

    badRequest(err, req, res, next) {
        res.status(400).send({
            code: err.code,
            data: err.data,
            message: err.message,
            stack: this._config.debug.sendStackToClient ? err.stack : undefined
        });
    }

    forbidden(err, req, res, next) {
        res.status(403).send({
            code: err.code,
            data: err.data,
            message: err.message,
            stack: this._config.debug.sendStackToClient ? err.stack : undefined
        });
    }

    unauthorized(err, req, res, next) {
        res.status(401).send({
            code: err.code,
            data: err.data,
            message: err.message,
            stack: this._config.debug.sendStackToClient ? err.stack : undefined
        });
    }

    notFount(err, req, res, next) {
        res.status(404).send({
            code: err.code,
            data: err.data,
            message: err.message,
            stack: this._config.debug.sendStackToClient ? err.stack : undefined
        });
    }
}
