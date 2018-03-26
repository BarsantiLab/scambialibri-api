import * as mongoose from 'mongoose';

import { ISchool, ISchoolModel } from 'interfaces/school.interface';
import { ISpecialization } from 'interfaces/specialization.interface';

export class SchoolSchema extends mongoose.Schema implements ISchool {
    name: string;
    specializations: [ISpecialization];

    constructor() {
        super({
            name: String,
            specializations: [{
                ref: 'Specialization',
                type: mongoose.Schema.Types.ObjectId
            }]
        });
    }
}

// tslint:disable-next-line:variable-name
export const School = mongoose.model<ISchoolModel>('School', new SchoolSchema());
