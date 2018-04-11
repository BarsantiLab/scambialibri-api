import { Document } from 'mongoose';

import { ISpecialization } from './specialization.interface';

export interface ISchool {
    name: string;
    specializations: [ISpecialization];
}

export interface ISchoolModel extends Document, ISchool { }
