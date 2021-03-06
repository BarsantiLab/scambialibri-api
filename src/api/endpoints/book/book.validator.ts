import { injectable } from 'inversify';
import { Joi, validate } from 'utils/joi-extension';

@injectable()
export class BookValidator {
    getBooks(req, res, next) {
        validate({
            object: req.query,
            schema: Joi.object().keys({
                grade: Joi.string().objectId(),
                // TODO: convert to offertype
                type: Joi.string().bookMode().required()
            })
        }, next);
    }
}
