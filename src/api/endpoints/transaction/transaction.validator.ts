import { injectable } from 'inversify';
import { Joi, validate } from 'utils/joi-extension';

@injectable()
export class TransactionValidator {
    createTransaction(req, res, next) {
        validate({
            object: req.body,
            schema: Joi.object().keys({
                book: Joi.string().objectId().required(),
                mode: Joi.string().bookMode().required(),
                bookStatus: Joi.string().bookStatus(),
                additionalMaterial: Joi.boolean()
            })
        }, next);
    }

    cancelTransaction(req, res, next) {
        validate({
            object: req.params,
            schema: Joi.object().keys({
                id: Joi.string().objectId().required()
            })
        }, next);
    }
}
