import { Document } from 'mongoose';

import { IBook } from './book.interface';
import { ISchool } from './school.interface';
import { ISpecialization } from './specialization.interface';

export interface IGrade {
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
}

export interface IGradeModel extends Document, IGrade { }
