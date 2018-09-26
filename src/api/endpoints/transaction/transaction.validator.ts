import { injectable } from 'inversify';
import { Joi, validate } from 'utils/joi-extension';

@injectable()
export class TransactionValidator {
    createTransaction(req, res, next) {
        validate({
            object: req.body,
            schema: Joi.object().keys({
                buyer: Joi.string().objectId().required(),
                seller: Joi.string().objectId().required()
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

    reportNotResponding(req, res, next) {
        validate({
            object: req.params,
            schema: Joi.object().keys({
                id: Joi.string().objectId().required()
            })
        }, next);
    }

    reportCompleted(req, res, next) {
        validate({
            object: req.params,
            schema: Joi.object().keys({
                id: Joi.string().objectId().required()
            })
        }, next);
    }

    sendMessage(req, res, next) {
        validate([{
            object: req.params,
            schema: Joi.object().keys({
                id: Joi.string().objectId().required()
            })
        }, {
            object: req.body,
            schema: Joi.object().keys({
                message: Joi.string().required()
            })
        }], next);
    }
}
