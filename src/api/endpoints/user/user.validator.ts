import { injectable } from 'inversify';

// import { Joi, validate } from 'utils/joi-extension';

@injectable()
export class UserValidator {
    login(req, res, next) {
        // TODO: fix!

        // validate({
        //     object: req.body,
        //     schema: Joi().object().keys({
        //         mail: Joi().string().email().required(),
        //         password: Joi().string().required()
        //     })
        // }, next);

        next();
    }

    signup(req, res, next) {
        // TODO: fix error!

        // validate({
        //     object: req.body,
        //     schema: Joi().object().keys({
        //         mail: Joi().string().email().required(),
        //         password: Joi().string().required()
        //     })
        // }, next);

        next();
    }

    // TODO: add validation
    getUser(req, res, next) {
        next();
    }

    // TODO: add validation
    getUserSchool(req, res, next) {
        next();
    }
}
