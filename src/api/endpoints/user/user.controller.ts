import { injectable } from 'inversify';

import * as passport from 'passport';

import { IRequestSessionHandler } from 'api/request-session-handler';
import { ApiError, ErrorCode } from 'core/error-codes';

import { ISchool } from 'interfaces/school.interface';
import { IUser } from 'interfaces/user.interface';

import { MailService } from 'services/mail.service';

import { School } from 'models/school.model';
import { User } from 'models/user.model';

@injectable()
export class UserController {
    constructor(
        private _mailService: MailService
    ) { }

    login(req: IRequestSessionHandler, res, next) {
        try {
            passport.authenticate('local-login', (err, user, info) => {
                if (err) throw new ApiError(ErrorCode.InternalServerError, err);
                if (!user) throw new ApiError(ErrorCode.Unauthorized);

                res.send({
                    id: user._id.toString(),
                    accessToken: user.accessToken,
                    onboardingCompleted: user.onboardingCompleted
                });
            })(req, res, next);
        } catch (err) {
            next(err);
        }
    }

    logout(req, res) { }

    async signup(req, res, next) {
        try {
            passport.authenticate('local-signup', async (err, user: IUser, info) => {
                if (err) {
                    if (err.errorCodeObject.code === 1005) throw new ApiError(ErrorCode.DuplicateMail, err);
                    throw new ApiError(ErrorCode.InternalServerError, err);
                }

                await this._mailService.send({
                    template: 'confirm-account',
                    to: user.mail,
                    subject: 'Scambialibri.it - conferma account',
                    data: {
                        token: user.confirmationToken
                    }
                });

                res.send({ status: 'ok' });
            })(req, res, next);
        } catch (err) {
            next(err);
        }
    }

    // TODO: if user is not admin show only own data
    async getUser(req, res, next) {
        try {
            const user: IUser = await User.findById(req.params.id).populate(req.query.populate);

            // TODO: replace with proper error
            if (!user) throw new ApiError(ErrorCode.InternalServerError, { id: req.params.id });

            // TODO: sanitize output
            res.send(user);
        } catch (err) {
            next(err);
        }
    }

    // TODO: if user is not admin show only own data
    async getUserSchool(req, res, next) {
        try {
            const user: any = await User.findById(req.params.id);
            // TODO: send proper error
            if (!user) throw new ApiError(ErrorCode.InternalServerError, { id: req.params.id });

            console.log('====================================');
            console.log(user);
            console.log('====================================');
            console.log(user.school);
            console.log('====================================');
            const school: ISchool = await School.findById(user.school);
            // TODO: send proper error
            if (!school) throw new ApiError(ErrorCode.InternalServerError, { id: user.school });

            // TODO: sanitize
            res.send(school);
        } catch (err) {
            next(err);
        }
    }
}

// TODO: move to appropriate API call
// import { User, UserRole } from 'models/user.model';
// import { hashPassword } from 'utils/crypt';

// (async () => {
//     const u = new User({
//         activated: true,
//         mail: 'davide.ross93@gmail.com',
//         password: hashPassword('davide12'),
//         role: UserRole.administrator
//     });

//     await u.save();
//     console.log(u);
// })();
