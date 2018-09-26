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

import { GeoService } from 'services/geo.service';
import { MailService } from 'services/mail.service';

import { hashPassword, uuid } from 'utils/crypt';

@injectable()
export class UserController {
    constructor(
        private _mail: MailService,
        private _geo: GeoService
    ) { }

    login(req: IRequestSessionHandler, res, next) {
        try {
            passport.authenticate('local-login', (err, user, info) => {
                try {
                    if (err) throw err;
                    if (!user) throw new ApiError(ErrorCode.Unauthorized);

                    res.send({
                        id: user._id.toString(),
                        accessToken: user.accessToken,
                        onboardingCompleted: user.onboardingCompleted
                    });
                } catch (err) {
                    next(err);
                }
            })(req, res, next);
        } catch (err) {
            next(err);
        }
    }

    logout() { }

    async signup(req, res, next) {
        try {
            passport.authenticate('local-signup', async (err, user: IUser, info) => {
                try {
                    if (err) {
                        // TODO: fix?
                        if (err.errorCodeObject && err.errorCodeObject.code === 1005) throw new ApiError(ErrorCode.DuplicateMail, err);
                        throw new ApiError(ErrorCode.InternalServerError, err);
                    }

                    await this._mail.send({
                        template: 'confirm-account',
                        to: user.mail,
                        subject: 'Conferma account',
                        data: {
                            token: user.confirmationToken
                        }
                    });

                    res.send({ status: 'ok' });
                } catch (err) {
                    next(err);
                }
            })(req, res, next);
        } catch (err) {
            next(err);
        }
    }

    async completeOnboarding(req, res, next) {
        try {
            const user: IUser = await User.findOne({ confirmationToken: req.query.token });
            if (!user) throw new ApiError(ErrorCode.UserNotFound);
            if (user.onboardingCompleted) throw new ApiError(ErrorCode.OnboardingAlreadyCompleted);

            const school: ISchool = await School.findById(req.body.school);
            const spec: ISpecialization = await Specialization.findById(req.body.specialization);
            const grade: IGrade = await Grade.findById(req.body.grade);

            const futureGrade: IGrade = await Grade.findOne({
                specialization: (spec as any)._id,
                school: (school as any)._id,
                section: grade.section,
                year: grade.year + 1
            });

            if (!grade) {
                throw new ApiError(ErrorCode.GradeNotFound, {
                    grade: req.body.grade
                });
            }

            if (!(spec as any).school.equals((school as any)._id)) {
                throw new ApiError(ErrorCode.SpecializationNotRelatedToSchool, {
                    specialiazion: (spec as any)._id.toString(),
                    school: (school as any)._id.toString()
                });
            }

            if (!(grade as any).school.equals((school as any)._id) || !(grade as any).specialization.equals((spec as any)._id)) {
                throw new ApiError(ErrorCode.GradeNotRelatedToSpecializationOrSchool, {
                    grade: (grade as any)._id.toString(),
                    specialiazion: (spec as any)._id.toString(),
                    school: (school as any)._id.toString()
                });
            }

            user.firstName = req.body.firstName;
            user.lastName = req.body.lastName;
            user.phone = req.body.phone;
            user.address = req.body.address;
            user.city = req.body.city;
            user.zipCode = req.body.zipCode;
            user.province = req.body.province;

            user.school = (school as any)._id;
            user.specialization = (spec as any)._id;
            user.currentGrade = (grade as any)._id;

            if (futureGrade) user.futureGrade = (futureGrade as any)._id;

            user.onboardingCompleted = true;

            // TODO: test this
            const geoData = await this._geo.geocode(`${user.address}, ${user.zipCode} ${user.city} (${user.province})`);
            const loc = geoData.results[0].geometry.location;
            user.coords = [loc.lng, loc.lat];

            await User.findByIdAndUpdate((user as any)._id, user);
            res.send({ status: 'ok' });
        } catch (err) {
            next(err);
        }
    }

    async getUser(req, res, next) {
        try {
            const user: IUser = await User.findById(req.params.id).populate(req.query.populate);
            if (!user) throw new ApiError(ErrorCode.UserNotFound, { id: req.params.id });

            // TODO: sanitize output
            res.send(user);
        } catch (err) {
            next(err);
        }
    }

    async getUserSchool(req, res, next) {
        try {
            const user: any = await User.findById(req.params.id);
            if (!user) throw new ApiError(ErrorCode.UserNotFound, { user: req.params.id });

            const school: ISchool = await School.findById(user.school);
            if (!school) throw new ApiError(ErrorCode.SchoolNotFound, { school: user.school });

            res.send({
                id: (school as any)._id.toString(),
                name: school.name
            });
        } catch (err) {
            next(err);
        }
    }

    async getUserGrade(req, res, next) {
        try {
            const user: any = await User.findById(req.params.id);
            if (!user) throw new ApiError(ErrorCode.UserNotFound, { id: req.params.id });

            const grade: IGrade = await Grade.findById(user.currentGrade);
            if (!grade) throw new ApiError(ErrorCode.GradeNotFound, { grade: user.currentGrade });

            res.send({
                id: (grade as any)._id.toString(),
                year: grade.year,
                section: grade.section
            });
        } catch (err) {
            next(err);
        }
    }

    async recoverPassword(req, res, next) {
        try {
            const user = await User.findOne({ mail: req.body.mail });
            if (!user) throw new ApiError(ErrorCode.UserNotFound, { mail: req.body.mail });

            const token = uuid(32);

            await User.findOneAndUpdate({
                mail: req.body.mail
            }, {
                passwordResetToken: token
            });

            await this._mail.send({
                template: 'forgot-password',
                to: user.mail,
                subject: 'Password dimenticata',
                data: { token }
            });

            res.send({ status: 'ok' });
        } catch (err) {
            next(err);
        }
    }

    async setNewPassword(req, res, next) {
        try {
            const user = await User.findOne({ passwordResetToken: req.body.token });
            if (!user) throw new ApiError(ErrorCode.UserNotFound);

            const newHash = hashPassword(req.body.password);

            await User.findOneAndUpdate({
                _id: (user as any)._id
            }, {
                password: newHash,
                passwordResetToken: null
            });

            res.send({ status: 'ok' });
        } catch (err) {
            next(err);
        }
    }
}
