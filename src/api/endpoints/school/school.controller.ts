import { injectable } from 'inversify';

import { ISchool } from 'interfaces/school.interface';
import { Grade } from 'models/grade.model';
import { School } from 'models/school.model';

import { ApiError, ErrorCode } from 'core/error-codes';
import { IGrade } from 'interfaces/grade.interface';
import { ISpecialization } from 'interfaces/specialization.interface';
import { Specialization } from 'models/specialiazion.model';

@injectable()
export class SchoolController {
    async getSchools(req, res, next) {
        try {
            const schools: ISchool[] = await School.find();
            res.send(schools.map((e: any) => ({
                id: e._id.toString(),
                name: e.name
            })));
        } catch (err) {
            next(err);
        }
    }

    async getSpecialization(req, res, next) {
        try {
            const school: ISchool = await School.findById(req.params.id).populate('specializations');
            if (!school) throw new ApiError(ErrorCode.SchoolNotFound);

            const specs: ISpecialization[] = await Specialization.find({
                school: (school as any)._id
            });

            res.send(specs.map((e: any) => ({
                id: e._id.toString(),
                name: e.name
            })));
        } catch (err) {
            next(err);
        }
    }

    async getClasses(req, res, next) {
        try {
            const grades: IGrade[] = await Grade.find({
                school: req.params.school,
                specialization: req.params.spec
            });

            res.send(grades.map((e: any) => ({
                id: e._id.toString(),
                year: e.year,
                section: e.section
            })));
        } catch (err) {
            next(err);
        }
    }
}
