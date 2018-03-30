import { injectable } from 'inversify';

import * as passport from 'passport';

import { IRequestSessionHandler } from 'api/request-session-handler';
import { ApiError, ErrorCode } from 'core/error-codes';

import { IGrade } from 'interfaces/grade.interface';
import { ISchool } from 'interfaces/school.interface';
import { ISpecialization } from 'interfaces/specialization.interface';
import { IUser } from 'interfaces/user.interface';

import { Grade } from 'models/grade.model';
import { School } from 'models/school.model';
import { Specialization } from 'models/specialiazion.model';
import { User } from 'models/user.model';

import { MailService } from 'services/mail.service';

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

    async completeOnboarding(req, res, next) {
        try {
            console.log(req.query);
            const user: IUser = await User.findOne({ confirmationToken: req.query.token });
            // TODO: set proper error code
            if (!user) throw new ApiError(ErrorCode.InternalServerError, 'User not found');

            const school: ISchool = await School.findById(req.body.school);
            const spec: ISpecialization = await Specialization.findById(req.body.specialization);
            const grade: IGrade = await Grade.findById(req.body.class);

            // TODO: req.body.class => req.body.grade
            const futureGrade: IGrade = await Grade.findOne({
                specialization: (spec as any)._id,
                school: (school as any)._id,
                section: grade.section,
                year: grade.year + 1
            });

            // TODO: set proper error code
            if (!(spec as any).school.equals((school as any)._id)) {
                throw new ApiError(ErrorCode.InternalServerError, 'Specialization is not related to School');
            }

            // TODO: test
            // TODO: set proper error code
            if (!(grade as any).school.equals((school as any)._id) || !(grade as any).specialization.equals((spec as any)._id)) {
                throw new ApiError(ErrorCode.InternalServerError, 'Grade is not related to School or Specialization');
            }

            // TODO: check if grade exists

            user.firstName = req.body.firstName;
            user.lastName = req.body.lastName;
            user.phone = req.body.phone;
            user.address = req.body.address;
            user.city = req.body.city;
            user.zipCode = req.body.zipCode;
            user.province = req.body.province;

            user.school = (school as any)._id;
            user.specialization = (spec as any)._id;
            user.currentClass = (grade as any)._id;

            if (futureGrade) user.futureClass = (futureGrade as any)._id;

            user.onboardingCompleted = true;

            // TODO: add geo service

            console.log((user as any)._id);
            await User.findByIdAndUpdate((user as any)._id, user);
            res.send({ status: 'ok' });
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
