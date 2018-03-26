import { injectable } from 'inversify';
import { Joi, validate } from 'utils/joi-extension';

@injectable()
export class BookValidator {
    getBooks(req, res, next) {
        validate({
            object: req.query,
            schema: Joi.Object().keys({
                class: Joi.string().objectId(),
                mode: Joi.string().bookMode().required()
            })
        }, next);
    }

    getInstances(req, res, next) {
        // TODO: write validator
        next();
    }
}
