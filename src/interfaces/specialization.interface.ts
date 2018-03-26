import { Document } from 'mongoose';
import { ISchool } from './school.interface';

export interface ISpecialization {
    name: string;
    school: ISchool;
}

export interface ISpecializationModel extends Document, ISpecialization { }
