import { injectable } from 'inversify';
import { Joi, validate } from 'utils/joi-extension';

@injectable()
export class UserValidator {
    login(req, res, next) {
        validate({
            object: req.body,
            schema: Joi.object().keys({
                mail: Joi.string().email().required(),
                password: Joi.string().required()
            })
        }, next);
    }

    signup(req, res, next) {
        validate({
            object: req.body,
            schema: Joi.object().keys({
                mail: Joi.string().email().required(),
                password: Joi.string().required()
            })
        }, next);
    }

    getUser(req, res, next) {
        validate([{
            object: req.params,
            schema: Joi.object().keys({
                id: Joi.string().objectId().required()
            })
        }, {
            object: req.query,
            schema: Joi.object().keys({
                populate: Joi.array().items(Joi.string())
            })
        }], next);
    }

    getUserSchool(req, res, next) {
        validate({
            object: req.params,
            schema: Joi.object().keys({
                id: Joi.string().objectId().required()
            })
        }, next);
    }

    completeOnboarding(req, res, next) {
        validate([{
            object: req.query,
            schema: Joi.object().keys({
                token: Joi.string().required()
            })
        }, {
            object: req.body,
            schema: Joi.object().keys({
                school: Joi.string().objectId().required(),
                specialization: Joi.string().objectId().required(),
                grade: Joi.string().objectId().required(),
                firstName: Joi.string().required(),
                lastName: Joi.string().required(),
                phone: Joi.string().required(),
                address: Joi.string().required(),
                city: Joi.string().required(),
                zipCode: Joi.string().required(),
                province: Joi.string().required(),
            })
        }], next);
    }

    getUserGrade(req, res, next) {
        validate({
            object: req.params,
            schema: Joi.object().keys({
                id: Joi.string().objectId().required()
            })
        }, next);
    }

    recoverPassword(req, res, next) {
        validate({
            object: req.body,
            schema: Joi.object().keys({
                mail: Joi.string().email().required()
            })
        }, next);
    }

    setNewPassword(req, res, next) {
        validate({
            object: req.body,
            schema: Joi.object().keys({
                password: Joi.string().required(),
                token: Joi.string().required()
            })
        }, next);
    }
}
