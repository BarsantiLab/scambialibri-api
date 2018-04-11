import { injectable } from 'inversify';
import { Joi, validate } from 'utils/joi-extension';

@injectable()
export class SchoolValidator {
    getSpecializations(req, res, next) {
        validate({
            object: req.params,
            schema: Joi.object().keys({
                id: Joi.string().objectId()
            })
        }, next);
    }

    getGrades(req, res, next) {
        validate({
            object: req.params,
            schema: Joi.object().keys({
                school: Joi.string().objectId(),
                spec: Joi.string().objectId()
            })
        }, next);
    }

    prepareGradeFilter(req, res, next) {
        validate({
            object: req.params,
            schema: Joi.object().keys({
                school: Joi.string().objectId()
            })
        }, next);
    }
}
