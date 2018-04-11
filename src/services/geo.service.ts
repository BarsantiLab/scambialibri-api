import { injectable } from 'inversify';

import * as request from 'request-promise-native';
import * as requestErrors from 'request-promise-native/errors';

import { Configuration } from 'core/config';
import { ApiError, ErrorCode } from 'core/error-codes';

@injectable()
export class GeoService {
    constructor(
        private _config: Configuration
    ) { }

    async geocode(address) {
        try {
            const geoObj = await request.get(this._config.google.geoUrl, {
                qs: {
                    address,
                    components: 'country:IT',
                    key: this._config.google.token
                }
            });

            return JSON.parse(geoObj);
        } catch (err) {
            if (err instanceof requestErrors.StatusCodeError) {
                throw new ApiError(ErrorCode.UnreachableExternalAPI);
            }

            throw err;
        }
    }
}
