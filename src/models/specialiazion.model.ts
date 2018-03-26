import * as mongoose from 'mongoose';

import { ISchool } from 'interfaces/school.interface';
import { ISpecialization, ISpecializationModel } from 'interfaces/specialization.interface';

export class SpecializationSchema extends mongoose.Schema implements ISpecialization {
    name: string;
    school: ISchool;

    constructor() {
        super({
            name: String,

            school: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'School'
            }
        });
    }
}

// tslint:disable-next-line:variable-name
export const Specialization = mongoose.model<ISpecializationModel>('Specialization', new SpecializationSchema());
