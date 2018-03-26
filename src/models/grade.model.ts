import * as mongoose from 'mongoose';

import { IBook } from 'interfaces/book.interface';
import { IGrade, IGradeModel } from 'interfaces/grade.interface';
import { ISchool } from 'interfaces/school.interface';
import { ISpecialization } from 'interfaces/specialization.interface';

export class GradeSchema extends mongoose.Schema implements IGrade {
    year: number;
    section: string;

    specialization: ISpecialization;
    school: ISchool;

    defaultBooks: [{
        book: IBook;

        isNecessary: boolean,
        isAdvised: boolean,
        isNewAdoption: boolean
    }];

    constructor() {
        super({
            year: Number,
            section: String,

            specialization: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Specialization'
            },

            school: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'School'
            },

            books: [{
                book: {
                    type: mongoose.Schema.Types.ObjectId,
                    rel: 'Book'
                },

                isNecessary: Boolean,
                isAdvised: Boolean,
                isNewAdoption: Boolean
            }]
        });
    }
}

// tslint:disable-next-line:variable-name
export const Grade = mongoose.model<IGradeModel>('Grade', new GradeSchema());
