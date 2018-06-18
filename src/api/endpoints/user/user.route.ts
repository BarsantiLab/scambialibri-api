import { Router } from 'express';
import { injectable } from 'inversify';

import { UserValidator } from './user.validator';

import { UserController } from 'api/endpoints/user/user.controller';
import { Policy, Role } from 'core/policy';

@injectable()
export class UserRoute {
    constructor(
        private _validator: UserValidator,
        private _ctrl: UserController,
        private _policy: Policy
    ) { }

    setupRoutes(router: Router) {

        // TODO: add errors description

        /**
         *
         * @api {POST} /user/login Login
         * @apiName Login
         * @apiGroup User
         * @apiVersion  1.0.0
         *
         * @apiDescription Perform user login through e-mail and password authentication strategy
         *
         * @apiParam  {String} mail E-mail associated to an account
         * @apiParam  {String} password Plain password
         *
         * @apiSuccess (200) {string} token Access token for HTTP Authentication
         * @apiSuccess (200) {string} id UUID of the logged user
         * @apiSuccess (200) {string} mail E-mail address
         *
         * @apiParamExample  {json} Request-Example:
         * {
         *     "mail": "davide@crispybacon.it",
         *     "password": "test1234"
         * }
         *
         *
         * @apiSuccessExample {json} Success-Response:
         * {
         *     "token": "gPjyD1d9t2Nz1k6m==",
         *     "id": "59ba42d38af57e33455f31c2"
         *     "mail": "davide@crispybacon.it"
         * }
         *
         *
         */
        router.post('/user/login', this._validator.login, this._ctrl.login);

        /**
         *
         * @api {POST} /user/logout Logout
         * @apiName Logout
         * @apiGroup User
         * @apiVersion  1.0.0
         *
         * @apiDescription Perform user logout and invalidate the user token
         *
         * @apiSuccessExample {json} Success-Response:
         * HTTP/1.1 200 OK
         *
         *
         */
        router.post('/user/logout', this._ctrl.logout);

        // TODO: add docs
        router.post('/user/signup',
            this._validator.signup,
            this._ctrl.signup.bind(this._ctrl)
        );

        // TODO: add docs
        router.get('/user/:id',
            this._policy.is(Role.authenticated),
            this._validator.getUser,
            this._ctrl.getUser.bind(this._ctrl)
        );

        // TODO: add docs
        router.get('/user/:id/school',
            this._policy.is(Role.authenticated),
            this._validator.getUserSchool,
            this._ctrl.getUserSchool.bind(this._ctrl)
        );

        // TODO: add docs
        router.post('/user/onboarding',
            this._validator.completeOnboarding,
            this._ctrl.completeOnboarding.bind(this._ctrl)
        );

        // TODO: add docs
        router.get('/user/:id/grade',
            this._validator.getUserGrade,
            this._ctrl.getUserGrade.bind(this._ctrl)
        );

        router.post('/user/forgot-password',
            this._validator.recoverPassword,
            this._ctrl.recoverPassword.bind(this._ctrl)
        );

        router.post('/user/set-password',
            this._validator.setNewPassword,
            this._ctrl.setNewPassword.bind(this)
        );
    }
}
