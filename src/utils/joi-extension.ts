import * as JoiPristine from 'joi';
import * as _ from 'lodash';
import * as mongoose from 'mongoose';

import { ApiError, ErrorCode } from 'core/error-codes';

export interface IValidationStep {
    object: any;
    schema: any;
}

// tslint:disable-next-line:variable-name
export const Joi = JoiPristine.extend(joi => ({
    base: joi.string(),
    language: {
        objectId: 'needs to be an ObjectId instance'
    },
    name: 'string',
    rules: [{
        name: 'objectId',
        validate(params, value, state, options) {
            if (!mongoose.Types.ObjectId.isValid(value)) {
                return this.createError('string.objectId', {
                    v: value
                }, state, options);
            }

            return value;
        }
    }, {
        name: 'bookMode',
        validate(params, value, state, options) {
            if (value !== 'sell' && value !== 'buy') {
                this.createError('string.bookMode', {
                    v: value
                }, state, options);
            }

            return value;
        }
    }]
}));

/**
 * Valida gli oggetti prendendo in input uno schema di Joi. Se la validazione passa chiama la callback, altrimenti lancia un errore di validazione
 *
 * @export
 * @param {(IValidationStep|IValidationStep[])} steps Step di validazione. Può essere un singolo oggetto ValidationStep oppure un array.
 * @param {any} [callback] Callback opzionale chiamata al successo della validazione
 */
export function validate(steps: IValidationStep|IValidationStep[], callback?) {
    if (!_.isArray(steps)) steps = [(steps as IValidationStep)];
    let errors = [];

    (steps as IValidationStep[]).forEach((step: IValidationStep) => {
        const result = Joi.validate(step.object, step.schema, {
            abortEarly: false
        });

        if (result.error) {
            errors = [...errors, ...result.error.details.map(err => ({
                label: err.context.label,
                type: err.type
            }))];
        }
    });

    if (errors.length > 0) {
        throw new ApiError(ErrorCode.ValidationError, errors);
    }

    if (callback) callback();
}
