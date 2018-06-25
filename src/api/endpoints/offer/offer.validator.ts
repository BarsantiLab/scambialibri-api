import { injectable } from 'inversify';
import { Joi, validate } from 'utils/joi-extension';

@injectable()
export class OfferValidator {
    createOffer(req, res, next) {
        validate({
            object: req.body,
            schema: Joi.object().keys({
                // TODO: check enum values
                type: Joi.string().required(),
                book: Joi.string().objectId().required(),
                bookStatus: Joi.string().bookStatus(),
                additionalMaterial: Joi.boolean()
            })
        }, next);
    }

    cancelOffer(req, res, next) {
        validate({
            object: req.params,
            schema: Joi.object().keys({
                id: Joi.string().objectId().required()
            })
        }, next);
    }
}
